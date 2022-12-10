import { $id, $size } from '@dark-star/core';

import { ComponentTypeId, ComponentType } from '../../component/component';

import { ArchetypeChunk } from './archetype-chunk';

export type EntityType = Set<ComponentTypeId>;

export class Archetype {
	public readonly entityType: EntityType;
	public readonly chunkCapacity: number;
	public readonly chunks: ArchetypeChunk[] = [];
	public readonly schemas: ReadonlyArray<ComponentType>;
	private readonly nonTagSchemas: ReadonlyArray<ComponentType>;

	constructor(componentTypes: Set<ComponentType>, public readonly id: number) {
		const entityType = new Set<ComponentTypeId>();
		const schemas = [];
		const nonTagSchemas = [];
		let entitySize = 0;

		for (const componentType of componentTypes) {
			entityType.add(componentType[$id]!);
			schemas.push(componentType);
			// not a tag
			if (componentType[$size]) {
				nonTagSchemas.push(componentType);
				entitySize += componentType[$size];
			}
		}

		this.entityType = entityType;
		this.schemas = schemas;
		this.nonTagSchemas = nonTagSchemas;
		this.chunkCapacity = entitySize > 0 ? Math.floor(16000 / entitySize) : Math.floor(16000 / Uint32Array.BYTES_PER_ELEMENT);
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

		const newChunk = new ArchetypeChunk(this.nonTagSchemas, this.chunkCapacity, this.chunks.length);
		this.chunks.push(newChunk);

		return newChunk;
	}
}
