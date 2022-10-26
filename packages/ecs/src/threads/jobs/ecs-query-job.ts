import {
	ComponentTypesQuery,
	ComponentTypes,
	ComponentQueryDescriptor,
	QueryRecord,
	convertQueryToDescriptors,
	queryHasWriter,
} from '../../query';
import { ArchetypeChunk } from '../../storage/archetype/archetype-chunk';
import { ParallelJob, JobHandle } from './job';
import { JobScheduler } from '../job-scheduler';
import { WorldUpdateVersion } from '../../world';

export abstract class ECSQueryJob<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypes,
	TSome extends ComponentTypes,
	TNone extends ComponentTypes
> implements ParallelJob
{
	protected accessDescriptors: ComponentQueryDescriptor[];

	constructor(
		protected query: QueryRecord<TAll, TSome, TNone>,
		access: T,
		protected lambda: (...args: any[]) => any,
		protected worldVersion: WorldUpdateVersion,
		protected scheduler?: JobScheduler,
		protected withChanges: boolean = false
	) {
		this.accessDescriptors = convertQueryToDescriptors(access);
	}

	public withChangedFilter(): this {
		this.withChanges = true;

		return this;
	}

	public abstract schedule(...dependencies: JobHandle[]): JobHandle;
	public abstract scheduleParallel(...dependencies: JobHandle[]): JobHandle;
	public abstract run(): Promise<void>;

	protected iterateChunks(iteratee: (chunk: ArchetypeChunk) => void): void {
		const worldVersion = this.worldVersion;
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
