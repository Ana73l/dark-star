import { $id, $size } from '@dark-star/shared-object';

import { ComponentTypeId, ComponentType } from '../../component';

import { ArchetypeChunk } from './archetype-chunk';

export type EntityType = Set<ComponentTypeId>;

export class Archetype {
	public readonly entityType: EntityType;
	public readonly chunkCapacity: number;
	public readonly chunks: ArchetypeChunk[] = [];
	public readonly schemas: ReadonlyArray<ComponentType>;

	constructor(componentTypes: Set<ComponentType>, public readonly id: number) {
		const entityType = new Set<ComponentTypeId>();
		const schemas = [];
		const layout = [];
		let entitySize = 0;

		for (const componentType of componentTypes) {
			entityType.add(componentType[$id]!);
			// not a tag
			if (componentType[$size]) {
				schemas.push(componentType);
				layout.push(componentType[$id]!);
				entitySize += componentType[$size];
			}
		}

		this.entityType = entityType;
		this.schemas = schemas;
		this.chunkCapacity = 16000 / entitySize;

		this.findOrCreateAvailableChunk();
	}

	public get count() {
		let entitiesCount = 0;
		const chunks = this.chunks;
		const chunksCount = chunks.length;
		let i;

		for (i = 0; i < chunksCount; i++) {
			entitiesCount += chunks[i].size;
		}

		return entitiesCount;
	}

	public findOrCreateAvailableChunk(): ArchetypeChunk {
		for (const chunk of this.chunks) {
			if (!chunk.full) {
				return chunk;
			}
		}

		const newChunk = new ArchetypeChunk(this.schemas, this.chunkCapacity, this.chunks.length);
		this.chunks.push(newChunk);

		return newChunk;
	}
}
