import { $id } from '@dark-star/core';
import {
	ComponentInstancesFromQuery,
	ComponentQueryDescriptor,
	ComponentTypes,
	ComponentTypesQuery,
	convertQueryToDescriptors,
	QueryRecord,
} from '../../query';
import { EntityEachLambdaWithEntities, JobHandle } from '../../threads';
import { ECSJobScheduler } from '../../threads/ecs-job-scheduler';
import { createNullHandle, ParallelJob } from '../../threads/job';
import { WorldUpdateVersion } from '../../world';

export class ECSEachWithEntitiesJob<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypes,
	TSome extends ComponentTypes,
	TNone extends ComponentTypes
> implements ParallelJob
{
	private accessDescriptors: ComponentQueryDescriptor[];

	constructor(
		private query: QueryRecord<TAll, TSome, TNone>,
		access: T,
		private lambda: EntityEachLambdaWithEntities<T, TAll, TSome, TNone>,
		private worldVersion: WorldUpdateVersion,
		private scheduler?: ECSJobScheduler,
		private withChanges: boolean = false
	) {
		this.accessDescriptors = convertQueryToDescriptors(access);
	}

	public withChangedFilter(): ECSEachWithEntitiesJob<T, TAll, TSome, TNone> {
		this.withChanges = true;

		return this;
	}

	public schedule(...dependencies: JobHandle[]): JobHandle {
		if (this.scheduler) {
			return this.scheduler.scheduleEntityEachWithEntitiesLambda(
				this.query,
				this.accessDescriptors,
				this.lambda,
				this.worldVersion,
				this.withChanges,
				false,
				dependencies
			);
		} else {
			// there are no threaded operations - run on scheduling
			this.execute();

			return createNullHandle();
		}
	}

	public scheduleParallel(...dependencies: JobHandle[]): JobHandle {
		if (this.scheduler) {
			return this.scheduler.scheduleEntityEachWithEntitiesLambda(
				this.query,
				this.accessDescriptors,
				this.lambda,
				this.worldVersion,
				this.withChanges,
				true,
				dependencies
			);
		} else {
			// there are no threaded operations - run on scheduling
			this.execute();

			return createNullHandle();
		}
	}

	public async run(): Promise<void> {
		if (this.scheduler) {
			await this.scheduler.completeJobs(this.scheduler.getDependencies(this.accessDescriptors));
		}

		this.execute();
	}

	private execute(): void {
		const archetypes = this.query[1];
		const archetypesCount = archetypes.length;
		const layout = this.accessDescriptors.map((descriptor) => descriptor.type[$id]!);
		const accessorsCount = layout.length;
		const lambda = this.lambda;
		const componentsProxy = new Array(accessorsCount + 1); // + 1 for entity
		const componentsArrayProxy = new Array(accessorsCount);
		let archetypeIndex;
		let inLayoutIndex;
		let entityIndex;
		let chunkIndex;

		for (archetypeIndex = 0; archetypeIndex < archetypesCount; archetypeIndex++) {
			const archetype = archetypes[archetypeIndex];
			const chunks = archetype.chunks;
			const chunksCount = chunks.length;

			for (chunkIndex = 0; chunkIndex < chunksCount; chunkIndex++) {
				const chunk = chunks[chunkIndex];
				const chunkSize = chunk.size;

				if (chunkSize > 0) {
					const entities = chunk.getEntitiesArray();

					for (inLayoutIndex = 0; inLayoutIndex < accessorsCount; inLayoutIndex++) {
						componentsArrayProxy[inLayoutIndex] = chunk.getComponentArray(layout[inLayoutIndex]);
					}

					for (entityIndex = 0; entityIndex < chunkSize; entityIndex++) {
						componentsProxy[0] = entities[entityIndex];
						for (inLayoutIndex = 0; inLayoutIndex < accessorsCount; inLayoutIndex++) {
							componentsProxy[inLayoutIndex + 1] = componentsArrayProxy[inLayoutIndex][entityIndex];

							// @ts-ignore
							lambda.apply(null, componentsProxy);
						}
					}
				}
			}
		}
	}
}
