import { $definition, $id, $size, assert, createUIDGenerator, UINT32_MAX } from '@dark-star/core';

import { Entity } from '../entity';
import { ComponentType, ComponentTypeId } from '../component/component';
import { QueryRecord, ComponentInstancesFromTypes, ComponentTypes } from '../query';

import { $componentsTable, $entitiesArray, componentDefaults } from './archetype/__internals__';
import { Archetype, EntityType } from './archetype/archetype';
import { $cleanupComponent } from '../component/__internals__';
import { CleanupComponentType } from '../component';

export type EntityRecord = {
	archetype: Archetype;
	chunkIndex: number;
	indexInChunk: number;
};

export class EntityStore {
	public currentWorldVersion: number = 0;
	public readonly entities: Map<Entity, EntityRecord> = new Map();

	private reusableEntities: Entity[] = [];
	private entitiesForDestruction: Set<Entity> = new Set();

	private uid = createUIDGenerator(1);

	private archetypes: Archetype[] = [];
	private queries: QueryRecord[] = [];

	public createEntity<T extends ComponentTypes>(
		componentTypes?: T,
		initial?: (entity: Entity, values: ComponentInstancesFromTypes<T>) => void
	): Entity {
		const entity = this.uid() || this.reusableEntities.pop();

		assert(entity !== undefined, `Entity limit ${UINT32_MAX} reached.`);

		const uniqueComponentTypes = new Set(componentTypes);

		const archetype = this.findOrCreateArchetype(uniqueComponentTypes);
		const chunk = archetype.findOrCreateAvailableChunk();
		const oldChunkSize = chunk.size;

		chunk[$entitiesArray][oldChunkSize] = entity;

		// register in stored entities
		this.entities.set(entity, {
			archetype,
			chunkIndex: chunk.id,
			indexInChunk: oldChunkSize
		});

		// if initial values are passed - set them
		if (componentTypes && initial) {
			const componentTypesArgLength = componentTypes.length;
			let componentTypeIndex;

			const componentInstances = [];
			for (componentTypeIndex = 0; componentTypeIndex < componentTypesArgLength; componentTypeIndex++) {
				const componentType = componentTypes[componentTypeIndex];
				const componentArray = chunk.getComponentArray(componentType);
				componentInstances.push(componentArray?.[oldChunkSize]);
			}

			initial(entity, componentInstances as ComponentInstancesFromTypes<T>);
		}

		// increment chunk size
		chunk[$size]++;
		chunk.worldVersion = this.currentWorldVersion;

		return entity;
	}

	public destroyEntity(entity: Entity): void {
		assert(this.entities.has(entity), `Cannot destroy entity ${entity} - entity does not exist`);

		const record = this.entities.get(entity)!;

		const archetype = record.archetype;
		const oldArchetypeSchemas = archetype.schemas;
		const nonCleanupComponents = [];
		// get all non-cleanup components
		for (const componentType of oldArchetypeSchemas) {
			if (!(componentType as CleanupComponentType)[$cleanupComponent]) {
				nonCleanupComponents.push(componentType);
			}
		}

		// if all components are non-cleanup - destroy entity
		if (nonCleanupComponents.length === oldArchetypeSchemas.length) {
			const chunk = archetype.chunks[record.chunkIndex];
			const entities = chunk[$entitiesArray];
			const oldChunkSize = chunk.size;

			// copy values from last element in removed entity's place (keep arrays packed)
			const toRemoveIndex = record.indexInChunk;
			const lastElementIndex = oldChunkSize - 1;

			if (toRemoveIndex === lastElementIndex) {
				entities[lastElementIndex] = 0;
			} else {
				const lastElementEntity = entities[lastElementIndex];

				// swap last element data with removed entity data
				chunk[$entitiesArray][toRemoveIndex] = lastElementEntity;
				for (const componentsArray of chunk[$componentsTable]) {
					const lastInstance = componentsArray[lastElementIndex];
					const toRemoveInstance = componentsArray[toRemoveIndex];

					const componentType = toRemoveInstance.constructor;
					const fields = componentType[$definition]!;

					// copy values of last element in place of removed entity to avoid gaps
					for (const fieldName in fields) {
						toRemoveInstance[fieldName] = lastInstance[fieldName];
					}
				}

				// update swapped entity's record
				this.entities.get(lastElementEntity)!.indexInChunk = toRemoveIndex;
			}

			// reset values of last element
			for (const componentsArray of chunk[$componentsTable]) {
				const lastInstance = componentsArray[lastElementIndex];
				this.resetComponentToDefaults(lastInstance);
			}

			this.entities.delete(entity);
			this.reusableEntities.push(entity);

			chunk[$size]--;
		} else {
			// there are cleanup components - detach all non-cleanup components
			// entity will be destroyed once all cleanup components are detached
			this.detachComponents(entity, nonCleanupComponents);
			this.entitiesForDestruction.add(entity);
		}
	}

	public exists(entity: Entity): boolean {
		return this.entities.has(entity);
	}

	public hasComponent<T extends ComponentType>(entity: Entity, componentType: T): boolean {
		if (this.entities.has(entity)) {
			const archetype = this.entities.get(entity)!.archetype;

			return archetype.entityType.has(componentType[$id]!);
		} else {
			return false;
		}
	}

	public hasAnyComponent<T extends ComponentTypes>(entity: Entity, componentTypes: T): boolean {
		if (this.entities.has(entity)) {
			const entityType = this.entities.get(entity)!.archetype.entityType;

			for (const componentType of componentTypes) {
				if (entityType.has(componentType[$id]!)) {
					return true;
				}
			}
		}

		return false;
	}

	public hasAllComponents<T extends ComponentTypes>(entity: Entity, componentTypes: T): boolean {
		if (this.entities.has(entity)) {
			const entityType = this.entities.get(entity)!.archetype.entityType;

			for (const componentType of componentTypes) {
				if (!entityType.has(componentType[$id]!)) {
					return false;
				}
			}

			return true;
		} else {
			return false;
		}
	}

	public getComponent<T extends ComponentType>(entity: Entity, componentType: T): InstanceType<T> | undefined {
		if (this.entities.has(entity)) {
			const record = this.entities.get(entity)!;
			const archetype = record.archetype;

			if (archetype.entityType.has(componentType[$id]!)) {
				const chunk = archetype.chunks[record.chunkIndex];

				return chunk.getComponentArray(componentType)![record.indexInChunk];
			}
		}

		return;
	}

	public attachComponents<T extends ComponentTypes>(
		entity: Entity,
		componentTypes: T,
		initial?: (values: ComponentInstancesFromTypes<T>) => void
	): void {
		assert(this.entities.has(entity), `Error attaching components to entity ${entity} - entity does not exist`);

		// only execute if there are components to add
		if (componentTypes.length > 0) {
			const record = this.entities.get(entity)!;
			const oldArchetype = record.archetype;
			const oldEntityType = oldArchetype.entityType;
			const oldChunk = oldArchetype.chunks[record.chunkIndex];
			const oldIndex = record.indexInChunk;
			const uniqueComponentTypes = new Set(componentTypes);
			const oldArchetypeSchemas = oldArchetype.schemas;

			// apply structural changes if archetype actually changes
			if (!entityTypeHasAll(uniqueComponentTypes, oldEntityType)) {
				// add old component types to new entity type
				for (const componentType of oldArchetypeSchemas) {
					uniqueComponentTypes.add(componentType);
				}

				// save last element entity data in old chunk
				const oldChunkLastElementIndex = oldChunk.size - 1;
				const oldChunkLastEntity = oldChunk[$entitiesArray][oldChunkLastElementIndex];

				// find new archetype
				const newArchetype = this.findOrCreateArchetype(uniqueComponentTypes);
				const newChunk = newArchetype.findOrCreateAvailableChunk();
				const newIndex = newChunk.size;

				// copy old values in new slot
				newChunk[$entitiesArray][newIndex] = entity;

				for (const componentType of oldArchetypeSchemas) {
					if (componentType[$size]) {
						const oldComponentArray = oldChunk.getComponentArray(componentType)!;
						const newComponentArray = newChunk.getComponentArray(componentType)!;
						const defaultValues = componentDefaults.get(componentType);

						const toMoveInstance = oldComponentArray[oldIndex];
						const lastInstanceInOldArray = oldComponentArray[oldChunkLastElementIndex];
						const newInstance = newComponentArray[newIndex];
						const fieldNames = Object.keys(componentType[$definition]!);

						// copy component values to new component array
						for (const fieldName of fieldNames) {
							newInstance[fieldName] = toMoveInstance[fieldName];
							// if entity wasn't last - copy data of last entity in its place to avoid gaps
							if (oldIndex !== oldChunkLastElementIndex) {
								toMoveInstance[fieldName] = lastInstanceInOldArray[fieldName];
							}
							// reset values of last element
							lastInstanceInOldArray[fieldName] = defaultValues[fieldName];
						}
					}
				}

				// if last element entity was swapped - update entity's record
				if (oldIndex !== oldChunkLastElementIndex) {
					oldChunk[$entitiesArray][oldIndex] = oldChunkLastEntity;
					this.entities.get(oldChunkLastEntity)!.indexInChunk = oldIndex;
				}
				// update entity record
				record.archetype = newArchetype;
				record.chunkIndex = newChunk.id;
				record.indexInChunk = newIndex;

				oldChunk[$size]--;
				newChunk[$size]++;

				newChunk.worldVersion = this.currentWorldVersion;

				if (initial) {
					const componentTypesArgLength = componentTypes.length;
					let componentTypeIndex;

					const componentInstances = [];
					for (componentTypeIndex = 0; componentTypeIndex < componentTypesArgLength; componentTypeIndex++) {
						const componentType = componentTypes[componentTypeIndex];
						const componentArray = newChunk.getComponentArray(componentType);
						componentInstances.push(componentInstances.push(componentArray ? componentArray[newIndex] : undefined));
					}

					initial(componentInstances as ComponentInstancesFromTypes<T>);
				}
			}
		}
	}

	public detachComponents<T extends ComponentTypes>(entity: Entity, componentTypes: T): void {
		assert(this.entities.has(entity), `Error detaching components from entity ${entity} - entity does not exist`);

		// only execute if there are components to detach
		if (componentTypes.length > 0) {
			const record = this.entities.get(entity)!;
			const oldArchetype = record.archetype;
			const oldEntityType = oldArchetype.entityType;
			const oldChunk = oldArchetype.chunks[record.chunkIndex];
			const oldIndex = record.indexInChunk;
			const uniqueComponentTypes = new Set(componentTypes);
			const oldArchetypeSchemas = oldArchetype.schemas;

			// create new entity type
			const newEntityType = new Set<ComponentType>();

			// add kept component types to new entity type
			for (const componentType of oldArchetypeSchemas) {
				if (!uniqueComponentTypes.has(componentType)) {
					newEntityType.add(componentType);
				}
			}

			// apply structural changes if archetype actually changes
			if (newEntityType.size !== oldEntityType.size) {
				// save last element entity data in old chunk
				const oldChunkLastElementIndex = oldChunk.size - 1;
				const oldChunkLastEntity = oldChunk[$entitiesArray][oldChunkLastElementIndex];

				// find new archetype
				const newArchetype = this.findOrCreateArchetype(newEntityType);
				const newChunk = newArchetype.findOrCreateAvailableChunk();
				const newIndex = newChunk.size;

				// copy old values in new slot
				newChunk[$entitiesArray][newIndex] = entity;

				for (const componentType of oldArchetypeSchemas) {
					if (componentType[$size]) {
						const oldComponentArray = oldChunk.getComponentArray(componentType)!;
						const newComponentArray = newChunk.getComponentArray(componentType);
						const defaultValues = componentDefaults.get(componentType)!;

						const toMoveInstance = oldComponentArray[oldIndex];
						const lastInstanceInOldArray = oldComponentArray[oldChunkLastElementIndex];
						const newInstance = newComponentArray?.[newIndex];
						const fieldNames = Object.keys(componentType[$definition]!);

						for (const fieldName of fieldNames) {
							// if component type exists in new archetype - copy fields
							if (newInstance) {
								newInstance[fieldName] = toMoveInstance[fieldName];
							}
							// if entity wasn't last in previous chunk - copy data of last entity to prevent gaps
							if (oldIndex !== oldChunkLastElementIndex) {
								toMoveInstance[fieldName] = lastInstanceInOldArray[fieldName];
							}
							// reset values of last element
							lastInstanceInOldArray[fieldName] = defaultValues[fieldName];
						}
					}
				}

				// if last element entity was swapped - update last element entity record
				if (oldIndex !== oldChunkLastElementIndex) {
					oldChunk[$entitiesArray][oldIndex] = oldChunkLastEntity;
					this.entities.get(oldChunkLastEntity)!.indexInChunk = oldIndex;
				}

				// if entity is left with no components and is flagged for destruction - remove it
				if (newArchetype.schemas.length === 0 && this.entitiesForDestruction.has(entity)) {
					this.reusableEntities.push(entity);
					this.entities.delete(entity);
				} else {
					// else update entity record
					record.archetype = newArchetype;
					record.chunkIndex = newChunk.id;
					record.indexInChunk = newIndex;

					newChunk[$size]++;
				}

				oldChunk[$size]--;
			}
		}
	}

	public registerQuery<TAll extends ComponentTypes, TSome extends ComponentTypes = [], TNone extends ComponentTypes = []>(
		all: TAll,
		some?: TSome,
		none?: TNone
	): QueryRecord {
		const queryAll = new Uint32Array(all.map((componentType) => componentType[$id]!));
		const querySome = new Uint32Array((some || []).map((componentType) => componentType[$id]!));
		const queryNone = (none || []).map((componentType) => componentType[$id]!);

		const queryAllSize = queryAll.length;
		const querySomeSize = querySome.length;
		const queryNoneSize = queryNone.length;

		// check existing queries for match
		queriesCycle: for (const query of this.queries) {
			const layout = query[0];
			const currentAll = layout[0];
			const currentSome = layout[1];
			const currentNone = layout[2] || [];

			// potential match
			if (queryAllSize === currentAll.length && querySomeSize === currentSome.length && queryNoneSize === currentNone.length) {
				// compare required components
				for (const componentTypeId of currentAll) {
					if (queryAll.indexOf(componentTypeId) < 0) {
						continue queriesCycle;
					}
				}

				for (const componentTypeId of currentSome) {
					if (querySome.indexOf(componentTypeId) < 0) {
						continue queriesCycle;
					}
				}

				for (const componentTypeId of currentNone) {
					if (queryNone.indexOf(componentTypeId) < 0) {
						continue queriesCycle;
					}
				}

				// match is found
				return query;
			}
		}

		// populate the query record with all matching archetypes. future archetypes will be added via createArchetype
		const matchingArchetypes: Archetype[] = [];

		const archetypes = this.archetypes;
		const archetypesCount = archetypes.length;
		let archetypeIndex;

		for (archetypeIndex = 0; archetypeIndex < archetypesCount; archetypeIndex++) {
			const archetype = archetypes[archetypeIndex];
			const entityType = archetype.entityType;
			// match
			if (typeIdsMatchEntityType(queryAll, entityType) && !anyTypeIdsMatchEntityType(queryNone, entityType)) {
				matchingArchetypes.push(archetype);
			}
		}

		const record = [[queryAll, querySome, queryNone], matchingArchetypes] as QueryRecord;

		this.queries.push(record);

		return record;
	}

	private createArchetype(componentTypes: Set<ComponentType>): Archetype {
		const archetype = new Archetype(componentTypes, this.archetypes.length);
		this.archetypes.push(archetype);

		// add archetype to matching queries
		const queries = this.queries;
		const queriesCount = this.queries.length;
		let queryIndex;

		for (queryIndex = 0; queryIndex < queriesCount; queryIndex++) {
			const query = queries[queryIndex];
			const layout = query[0];
			const queryAll = layout[0];
			const queryNone = layout[2];

			if (
				typeIdsMatchEntityType(queryAll, archetype.entityType) &&
				!anyTypeIdsMatchEntityType(queryNone || [], archetype.entityType)
			) {
				query[1].push(archetype);
			}
		}

		return archetype;
	}

	private findOrCreateArchetype(componentTypes: Set<ComponentType>): Archetype {
		const archetypes = this.archetypes;
		const archetypesCount = archetypes.length;
		let archetypeIndex;

		for (archetypeIndex = 0; archetypeIndex < archetypesCount; archetypeIndex++) {
			const archetype = archetypes[archetypeIndex];

			if (matchEntityTypes(componentTypes, archetype.entityType)) {
				return archetype;
			}
		}

		return this.createArchetype(componentTypes);
	}

	private resetComponentToDefaults(component: InstanceType<ComponentType>): void {
		const componentType = component.constructor;

		const defaultValues = componentDefaults.get(componentType);

		for (const fieldName in defaultValues) {
			component[fieldName] = defaultValues[fieldName];
		}
	}
}

function matchEntityTypes(toMatch: Set<ComponentType>, entityType: EntityType): boolean {
	if (toMatch.size !== entityType.size) {
		return false;
	}

	for (const componentType of toMatch) {
		if (!entityType.has(componentType[$id]!)) {
			return false;
		}
	}

	return true;
}

function matchAnyEntityTypes(toMatch: Set<ComponentType>, entityType: EntityType): boolean {
	for (const componentType of toMatch) {
		if (entityType.has(componentType[$id]!)) {
			return true;
		}
	}

	return false;
}

function entityTypeHasAll(toMatch: Set<ComponentType>, entityType: EntityType): boolean {
	for (const componentType of toMatch) {
		if (!entityType.has(componentType[$id]!)) {
			return false;
		}
	}

	return true;
}

function typeIdsMatchEntityType(toMatch: ComponentTypeId[] | Uint32Array, entityType: EntityType): boolean {
	for (const componentTypeId of toMatch) {
		if (!entityType.has(componentTypeId)) {
			return false;
		}
	}

	return true;
}

function anyTypeIdsMatchEntityType(toMatch: ComponentTypeId[] | Uint32Array, entityType: EntityType): boolean {
	for (const componentTypeId of toMatch) {
		if (entityType.has(componentTypeId)) {
			return true;
		}
	}

	return false;
}
