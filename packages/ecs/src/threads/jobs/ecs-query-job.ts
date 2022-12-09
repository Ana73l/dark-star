import { ComponentTypesQuery, ComponentTypes, ComponentQueryDescriptor, QueryRecord, queryHasWriter, write } from '../../query';
import { ArchetypeChunk } from '../../storage/archetype/archetype-chunk';
import { ParallelJob, JobHandle, JobArgs } from './job';
import { System } from '../../system/planning/__internals__';
import { $id } from '@dark-star/core';

export abstract class ECSQueryJob<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypes,
	TSome extends ComponentTypes,
	TNone extends ComponentTypes
> implements ParallelJob
{
	protected accessDescriptors: ComponentQueryDescriptor[];
	protected layout: Uint32Array;

	constructor(
		protected system: System,
		protected query: QueryRecord,
		access: T,
		protected lambda: (...args: any[]) => any,
		protected params?: JobArgs,
		protected withChanges: boolean = false
	) {
		const accessorsLength = access.length;
		const layout = new Uint32Array(accessorsLength);
		const accessDescriptors = [];
		let accessorIndex;

		for (accessorIndex = 0; accessorIndex < accessorsLength; accessorIndex++) {
			const accessor = access[accessorIndex];

			if (typeof accessor === 'function') {
				layout[accessorIndex] = accessor[$id]!;
				accessDescriptors[accessorIndex] = write(accessor);
			} else {
				layout[accessorIndex] = accessor.type[$id]!;
				accessDescriptors[accessorIndex] = accessor;
			}
		}

		this.layout = layout;
		this.accessDescriptors = accessDescriptors;
	}

	public withChangedFilter(): this {
		this.withChanges = true;

		return this;
	}

	public abstract schedule(...dependencies: JobHandle[]): JobHandle;
	public abstract scheduleParallel(...dependencies: JobHandle[]): JobHandle;
	public abstract run(): Promise<void>;

	protected iterateChunks(iteratee: (chunk: ArchetypeChunk) => void): void {
		const worldVersion = this.system.lastWorldVersion;
		const archetypes = this.query[1];
		const archetypesCount = archetypes.length;
		const hasWriter = queryHasWriter(this.accessDescriptors);
		let archetypeIndex;

		for (archetypeIndex = 0; archetypeIndex < archetypesCount; archetypeIndex++) {
			const archetype = archetypes[archetypeIndex];
			const chunks = archetype.chunks;
			const chunksCount = chunks.length;
			let chunkIndex;

			for (chunkIndex = 0; chunkIndex < chunksCount; chunkIndex++) {
				const chunk = chunks[chunkIndex];
				const chunkSize = chunk.size;

				// iterate only if there are entities in the chunk
				if (chunkSize > 0) {
					// skip if change filter is applied and chunk hasn't been written to
					if (this.withChanges && worldVersion > chunk.worldVersion) {
						continue;
					}

					iteratee(chunk);

					if (hasWriter) {
						chunk.worldVersion = worldVersion;
					}
				}
			}
		}
	}
}
