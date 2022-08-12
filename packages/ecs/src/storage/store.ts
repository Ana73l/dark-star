import { assert, createUIDGenerator, UINT32_MAX } from '@dark-star/core';
import { $definition, $id, $size } from '@dark-star/schema';

import { Archetype, EntityType } from './archetype/archetype';

import { Entity } from '../entity';
import { ComponentType, ComponentTypeId } from '../component';
import { QueryRecord, OptionalComponentPartialsFromTypes, ComponentInstancesFromTypes } from '../query';

import { $componentsTable, $entitiesArray } from './archetype/__internals__';

export const matchEntityTypes = (toMatch: Set<ComponentType>, entityType: EntityType): boolean => {
	if (toMatch.size !== entityType.size) {
		return false;
	}

	for (const componentType of toMatch) {
		if (!entityType.has(componentType[$id]!)) {
			return false;
		}
	}

	return true;
};
export const matchAnyEntityTypes = (toMatch: Set<ComponentType>, entityType: EntityType): boolean => {
	for (const componentType of toMatch) {
		if (entityType.has(componentType[$id]!)) {
			return true;
		}
	}

	return false;
};
export const entityTypeHasAll = (toMatch: Set<ComponentType>, entityType: EntityType): boolean => {
	for (const componentType of toMatch) {
		if (!entityType.has(componentType[$id]!)) {
			return false;
		}
	}

	return true;
};
export const typeIdsMatchEntityType = (toMatch: ComponentTypeId[] | Int32Array, entityType: EntityType): boolean => {
	for (const componentTypeId of toMatch) {
		if (!entityType.has(componentTypeId)) {
			return false;
		}
	}

	return true;
};
export const anyTypeIdsMatchEntityType = (toMatch: ComponentTypeId[] | Int32Array, entityType: EntityType): boolean => {
	for (const componentTypeId of toMatch) {
		if (entityType.has(componentTypeId)) {
			return true;
		}
	}

	return false;
};

export type EntityRecord = {
	archetype: Archetype;
	chunkIndex: number;
	indexInChunk: number;
};

export class EntityStore {
	public currentWorldVersion: number = 0;

	private entities: Map<Entity, EntityRecord> = new Map();
	private reusableEntities: Entity[] = [];
	private uid = createUIDGenerator(1);

	private archetypes: Archetype[] = [];
	private queries: QueryRecord<ComponentType[], ComponentType[], ComponentType[]>[] = [];

	public createEntity<T extends ComponentType[]>(
		componentTypes?: T,
		initial?: OptionalComponentPartialsFromTypes<T> | ((...values: ComponentInstancesFromTypes<T>) => void)
	): void {
		const entity = this.reusableEntities.pop() || this.uid();

		assert(entity !== null, `Entity limit ${UINT32_MAX} reached.`);

		const uniqueComponentTypes = new Set(componentTypes);

		const archetype = this.findOrCreateArchetype(uniqueComponentTypes);
		const chunk = archetype.findOrCreateAvailableChunk();
		const oldChunkSize = chunk.size;

		chunk[$entitiesArray][oldChunkSize] = entity;

		// if initial values are passed - set them
		if (componentTypes && initial) {
			const componentTypesArgLength = componentTypes.length;
			let componentTypeIndex;

			if (Array.isArray(initial)) {
				for (componentTypeIndex = 0; componentTypeIndex < componentTypesArgLength; componentTypeIndex++) {
					const componentType = componentTypes[componentTypeIndex];
					const definition = componentType[$definition];

					if (definition) {
						const componentData = initial[componentTypeIndex];

						if (componentData) {
							const componentsArray = chunk.getComponentArray(componentType)!;
							const componentInstance = componentsArray[oldChunkSize];

							for (const property of Object.keys(definition)) {
								const componentDataValue = componentData[property];

								if (componentDataValue !== undefined) {
									componentInstance[property] = componentDataValue;
								}
							}
						}
					}
				}
			} else {
				const componentInstances = [];
				for (componentTypeIndex = 0; componentTypeIndex < componentTypesArgLength; componentTypeIndex++) {
					const componentType = componentTypes[componentTypeIndex];
					const componentArray = chunk.getComponentArray(componentType)!;
					componentInstances.push(componentArray[oldChunkSize]);
				}

				initial(...(componentInstances as ComponentInstancesFromTypes<T>));
			}
		}

		// increment chunk size
		chunk[$size]++;
	}

	public destroyEntity(entity: Entity): void {
		assert(this.entities.has(entity), `Cannot destroy entity ${entity} - entity does not exist`);

		const record = this.entities.get(entity)!;

		const archetype = record.archetype;
		const chunk = archetype.chunks[record.chunkIndex];
		const entities = chunk[$entitiesArray];
		const oldChunkSize = chunk.size;

		// copy values from last element in removed entity's place (keep arrays packed)
		const toRemoveIndex = record.indexInChunk;
		const lastElementIndex = oldChunkSize - 1;

		if (toRemoveIndex === lastElementIndex) {
			entities[lastElementIndex] = 0;
			chunk[$size]--;

			return;
		}

		const lastElementEntity = entities[lastElementIndex];

		// swap last element data with removed entity data
		chunk[$entitiesArray][toRemoveIndex] = lastElementEntity;
		for (const componentsArray of chunk[$componentsTable]) {
			const lastInstance = componentsArray[lastElementIndex];
			const toRemoveInstance = componentsArray[toRemoveIndex];

			const componentType = toRemoveInstance.constructor;
			const fields = componentType[$definition]!;

			// copy values of last element in place of removed entity to avoid gaps
			// tslint:disable-next-line: forin
			for (const fieldName in fields) {
				toRemoveInstance[fieldName] = lastInstance[fieldName];
			}
		}

		// update swapped entity's record
		this.entities.get(lastElementEntity)!.indexInChunk = toRemoveIndex;
		this.reusableEntities.push(entity);

		chunk[$size]--;
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

	public hasAnyComponent<T extends ComponentType[]>(entity: Entity, componentTypes: T): boolean {
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

	public hasAllComponents<T extends ComponentType[]>(entity: Entity, componentTypes: T): boolean {
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
	}

	public attachComponents<T extends ComponentType[]>(
		entity: Entity,
		componentTypes: T,
		initial?: OptionalComponentPartialsFromTypes<T> | ((...values: ComponentInstancesFromTypes<T>) => void)
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
					const oldComponentArray = oldChunk.getComponentArray(componentType)!;
					const newComponentArray = newChunk.getComponentArray(componentType)!;

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

				if (initial) {
					const componentTypesArgLength = componentTypes.length;
					let componentTypeIndex;

					if (Array.isArray(initial)) {
						if (initial.length > 0) {
							for (
								componentTypeIndex = 0;
								componentTypeIndex < componentTypesArgLength;
								componentTypeIndex++
							) {
								const componentType = componentTypes[componentTypeIndex];
								const definition = componentType[$definition];

								if (definition) {
									const componentData = initial[componentTypeIndex];

									if (componentData) {
										const fieldNames = Object.keys(definition);
										const componentsArray = newChunk.getComponentArray(componentType)!;
										const componentInstance = componentsArray[newIndex];

										for (const fieldName of fieldNames) {
											const componentDataValue = componentData[fieldName];

											if (componentDataValue !== undefined) {
												componentInstance[fieldName] = componentDataValue;
											}
										}
									}
								}
							}
						}
					} else {
						const componentInstances = [] as unknown as ComponentInstancesFromTypes<T>;
						for (
							componentTypeIndex = 0;
							componentTypeIndex < componentTypesArgLength;
							componentTypeIndex++
						) {
							const componentType = componentTypes[componentTypeIndex];
							const componentArray = newChunk.getComponentArray(componentType)!;
							componentInstances.push(componentArray[newIndex]);
						}

						initial(...componentInstances);
					}
				}
			} else if (initial) {
				const componentTypesArgLength = componentTypes.length;
				let componentTypeIndex;

				if (Array.isArray(initial)) {
					if (initial.length > 0) {
						for (
							componentTypeIndex = 0;
							componentTypeIndex < componentTypesArgLength;
							componentTypeIndex++
						) {
							const componentType = componentTypes[componentTypeIndex];
							const definition = componentType[$definition];

							if (definition) {
								const componentData = initial[componentTypeIndex];

								if (componentData) {
									const fieldNames = Object.keys(definition);
									const componentsArray = oldChunk.getComponentArray(componentType)!;
									const componentInstance = componentsArray[oldIndex];

									for (const fieldName of fieldNames) {
										const componentDataValue = componentData[fieldName];

										if (componentDataValue !== undefined) {
											componentInstance[fieldName] = componentDataValue;
										}
									}
								}
							}
						}
					}
				} else {
					const componentInstances = [] as unknown as ComponentInstancesFromTypes<T>;
					for (componentTypeIndex = 0; componentTypeIndex < componentTypesArgLength; componentTypeIndex++) {
						const componentType = componentTypes[componentTypeIndex];
						const componentArray = oldChunk.getComponentArray(componentType)!;
						componentInstances.push(componentArray[oldIndex]);
					}

					initial(...componentInstances);
				}
			}
		}
	}

	public detachComponents<T extends ComponentType[]>(entity: Entity, componentTypes: T): void {
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
			if (!entityTypeHasAll(newEntityType, oldEntityType)) {
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
					const oldComponentArray = oldChunk.getComponentArray(componentType)!;
					const newComponentArray = newChunk.getComponentArray(componentType);

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
					}
				}

				// if last element entity was swapped - update record
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
			}
		}
	}

	public registerQuery<
		TAll extends ComponentType[],
		TSome extends ComponentType[] = [],
		TNone extends ComponentType[] = []
	>(all: TAll, some?: TSome, none?: TNone): QueryRecord<TAll, TSome, TNone> {
		const queryAll = new Int32Array(all.map((componentType) => componentType[$id]!));
		const querySome = new Int32Array((some || []).map((componentType) => componentType[$id]!));
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
			if (
				queryAllSize === currentAll.length &&
				querySomeSize === currentSome.length &&
				queryNoneSize === currentNone.length
			) {
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

		// populate the query record with all matching archetypes. future archetpes will be added via createArchetype
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

		return [[queryAll, querySome, queryNone], matchingArchetypes];
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
}
