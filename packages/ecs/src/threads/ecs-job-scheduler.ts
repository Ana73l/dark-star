import { Disposable, assert, createUIDGenerator } from '@dark-star/core';
import { TaskRunner, WorkerPool } from '@dark-star/worker-pool';
import { $id, $view } from '@dark-star/schema';

import { ComponentType, ComponentTypeId } from '../component';
import {
	ComponentAccessFlags,
	ComponentQueryDescriptor,
	ComponentTypesQuery,
	convertDescriptorsToQuery,
	QueryRecord,
} from '../query';

import { $dependencies, Job, JobId, JobHandle } from './job';
import { EntityLambdaTypes, EntityEachLambda, EntityEachLambdaWithEntities, EntityLambda } from './entity-lambda';
import {
	EnqueuedWorkerWorldCommands,
	EntityEachLambdaWorkerParams,
	EntityEachWithEntitiesLambdaWorkerParams,
	WorkerWorld,
} from './worker-world';
import { DeferredCommandsProcessor } from '../storage/deferred-commands-processor';

type ECSTask = TaskRunner<any, any>;

export interface ECSJob<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypesQuery,
	TSome extends ComponentTypesQuery = [],
	TNone extends ComponentType[] = []
> extends Job {
	readonly query: QueryRecord<TAll, TSome>;
	readonly accessDescriptors: ComponentQueryDescriptor[];
	readonly lambdaType: EntityLambdaTypes;
	readonly lambda: EntityLambda<T, TAll, TSome, TNone>;
	withChanges: boolean;
}

type EntityEachRunner = TaskRunner<EntityEachLambdaWorkerParams, EnqueuedWorkerWorldCommands>;
type EntityEachWithEntitiesRunner = TaskRunner<EntityEachWithEntitiesLambdaWorkerParams, EnqueuedWorkerWorldCommands>;

export class ECSJobScheduler implements Disposable {
	private readers: Map<ComponentTypeId, Set<JobId>> = new Map();
	private lastWriter: Map<ComponentTypeId, JobId> = new Map();

	private jobToDependees: Map<JobId, Set<JobId>> = new Map();
	private jobHandles: Map<JobId, JobHandle> = new Map();

	private uid: () => number | null = createUIDGenerator();
	private disposed: boolean = false;

	private entityEachRunner: EntityEachRunner;
	private entityEachWithEntitiesRunner: EntityEachWithEntitiesRunner;

	constructor(private workerPool: WorkerPool, private deferedCommandsProcessor: DeferredCommandsProcessor) {
		this.entityEachRunner = workerPool.createTask((data: EntityEachLambdaWorkerParams) => {
			// @ts-ignore
			return (world as WorkerWorld).handleEntityEachLambda(data);
		});

		this.entityEachWithEntitiesRunner = workerPool.createTask((data: EntityEachWithEntitiesLambdaWorkerParams) => {
			// @ts-ignore
			return (world as WorkerWorld).handleEntityEachWithEntitiesLambda(data);
		});
	}

	public get isDisposed(): boolean {
		return this.disposed;
	}

	public scheduleJob<
		T extends ComponentTypesQuery,
		TAll extends ComponentTypesQuery,
		TSome extends ComponentTypesQuery = [],
		TNone extends ComponentType[] = []
	>(job: ECSJob<T, TAll, TSome, TNone>, deps?: JobHandle[]): JobHandle {
		const id = this.uid()!;
		const type = job.lambdaType;
		const query = job.query;
		const accessDescriptors = job.accessDescriptors;
		const lambda = job.lambda;

		let handle;

		switch (type) {
			case EntityLambdaTypes.Each:
				handle = this.scheduleEntityEachLambda(
					id,
					query,
					accessDescriptors,
					lambda as EntityEachLambda<T, TAll, TSome, TNone>,
					deps
				);
				break;
			case EntityLambdaTypes.EachWithEntities:
				handle = this.scheduleEntityEachWithEntitiesLambda(
					id,
					query,
					accessDescriptors,
					// @ts-ignore
					lambda as EntityEachLambdaWithEntities<T, TAll, TSome, TNone>,
					deps
				);
				break;
			default:
				throw new Error(`Attempting to schedule invalid Entity Lambda type ${type}`);
		}

		this.jobHandles.set(id, handle);

		// if there are no dependencies - add to ready to run list
		if (handle[$dependencies]?.size === 0) {
			handle.complete();
		}

		return handle;
	}

	public dispose(): void {
		this.disposed = true;

		this.jobHandles.clear();
		this.jobToDependees.clear();
		this.readers.clear();
		this.lastWriter.clear();
	}

	private scheduleEntityEachLambda<
		T extends ComponentTypesQuery,
		TAll extends ComponentTypesQuery,
		TSome extends ComponentTypesQuery = [],
		TNone extends ComponentType[] = []
	>(
		id: number,
		query: QueryRecord<TAll, TSome>,
		accessDescriptors: ComponentQueryDescriptor[],
		lambda: EntityEachLambda<T, TAll, TSome, TNone>,
		deps?: JobHandle[]
	): JobHandle {
		const dependencies = this.getDependencies(id, accessDescriptors, deps);

		const layout = convertDescriptorsToQuery(accessDescriptors).map((type) => type[$id]!);
		const archetypes = query[1];

		const archetypesCount = archetypes.length;
		let archetypeIndex;

		const buffers: [size: number, buffers: (SharedArrayBuffer | undefined)[]][] = [];

		// iterate matching archetypes
		for (archetypeIndex = 0; archetypeIndex < archetypesCount; archetypeIndex++) {
			const archetype = archetypes[archetypeIndex];

			// execute only if there are entities in the archetype
			if (archetype.count) {
				const chunks = archetype.chunks;
				const chunksCount = chunks.length;
				let chunkIndex;

				// iterate chunks in archetype
				for (chunkIndex = 0; chunkIndex < chunksCount; chunkIndex++) {
					const chunk = chunks[chunkIndex];
					const chunkSize = chunk.size;

					// execute only if there are entities in the chunk
					if (chunkSize > 0) {
						const componentArrayBuffers: (SharedArrayBuffer | undefined)[] = [];

						for (const componentType of layout) {
							componentArrayBuffers.push(
								chunk.getComponentArray(componentType)?.[$view].buffer as SharedArrayBuffer | undefined
							);
						}

						buffers.push([chunkSize, componentArrayBuffers]);
					}
				}
			}
		}

		let isComplete = false;
		let promise: Promise<void>;

		return {
			id,
			get isComplete() {
				return isComplete;
			},
			complete: async () => {
				if (isComplete) {
					return;
				}

				if (promise) {
					return promise;
				}

				promise = new Promise(async (resolve) => {
					await this.completeJobs(dependencies);

					const enqueuedCommands = await this.entityEachRunner.run([
						new Int32Array(layout.length).map((_, index) => layout[index]),
						buffers,
						lambda.toString(),
					]);

					this.markAsComplete(id);

					isComplete = true;
					resolve();
				});

				return promise;
			},
			[$dependencies]: dependencies,
		};
	}

	private scheduleEntityEachWithEntitiesLambda<
		T extends ComponentTypesQuery,
		TAll extends ComponentTypesQuery,
		TSome extends ComponentTypesQuery = [],
		TNone extends ComponentType[] = []
	>(
		id: number,
		query: QueryRecord<TAll, TSome, TNone>,
		accessDescriptors: ComponentQueryDescriptor[],
		lambda: EntityEachLambdaWithEntities<T, TAll, TSome, TNone>,
		deps?: JobHandle[]
	): JobHandle {
		const dependencies = this.getDependencies(id, accessDescriptors, deps);

		const layout = convertDescriptorsToQuery(accessDescriptors).map((type) => type[$id]!);
		const archetypes = query[1];

		const archetypesCount = archetypes.length;
		let archetypeIndex;

		const buffers: [size: number, entities: Int32Array, buffers: (SharedArrayBuffer | undefined)[]][] = [];

		// iterate matching archetypes
		for (archetypeIndex = 0; archetypeIndex < archetypesCount; archetypeIndex++) {
			const archetype = archetypes[archetypeIndex];

			// execute only if there are entities in the archetype
			if (archetype.count) {
				const chunks = archetype.chunks;
				const chunksCount = chunks.length;
				let chunkIndex;

				// iterate chunks in archetype
				for (chunkIndex = 0; chunkIndex < chunksCount; chunkIndex++) {
					const chunk = chunks[chunkIndex];
					const chunkSize = chunk.size;

					// execute only if there are entities in the chunk
					if (chunkSize > 0) {
						const componentArrayBuffers: (SharedArrayBuffer | undefined)[] = [];

						for (const componentType of layout) {
							componentArrayBuffers.push(
								chunk.getComponentArray(componentType)?.[$view].buffer as SharedArrayBuffer | undefined
							);
						}

						buffers.push([chunkSize, chunk.getEntitiesArray(), componentArrayBuffers]);
					}
				}
			}
		}

		let isComplete = false;
		let promise: Promise<void>;

		return {
			id,
			get isComplete() {
				return isComplete;
			},
			complete: async () => {
				if (isComplete) {
					return;
				}

				if (promise) {
					return promise;
				}

				promise = new Promise(async (resolve) => {
					await this.completeJobs(dependencies);

					await this.entityEachWithEntitiesRunner.run([
						new Int32Array(layout.length).map((_, index) => layout[index]),
						buffers,
						lambda.toString(),
					]);

					this.markAsComplete(id);

					isComplete = true;
					resolve();
				});

				return promise;
			},
			[$dependencies]: dependencies,
		};
	}

	public async completeJobs(dependencies: Set<JobId>): Promise<void> {
		const jobHandles = this.jobHandles;
		const jobs: (() => Promise<void>)[] = [];

		for (const jobId of dependencies) {
			if (jobHandles.has(jobId)) {
				jobs.push(jobHandles.get(jobId)!.complete);
			}
		}

		await Promise.all(jobs);
	}

	private getDependencies(
		id: JobId,
		accessDescriptors: ComponentQueryDescriptor[],
		initial?: JobHandle[]
	): Set<JobId> {
		const writers = this.lastWriter;
		const readers = this.readers;
		const jobToDependees = this.jobToDependees;

		const dependencies: Set<JobId> =
			initial && initial.length > 0 ? new Set(initial.map((handle) => handle.id)) : new Set();

		const descriptorsCount = accessDescriptors.length;
		let descriptorIndex;

		for (descriptorIndex = 0; descriptorIndex < descriptorsCount; descriptorIndex++) {
			const descriptor = accessDescriptors[descriptorIndex];
			const componentType = descriptor.type;
			const componentTypeId = componentType[$id]!;
			const flag = descriptor.flag;

			// flag access is Read
			if (flag === ComponentAccessFlags.Read) {
				// set dependencies to last prior writer
				if (writers.has(componentTypeId)) {
					const lastWriter = writers.get(componentTypeId)!;
					dependencies.add(lastWriter);

					// current job to last writer dependees
					if (jobToDependees.has(lastWriter)) {
						jobToDependees.get(lastWriter)!.add(id);
					} else {
						jobToDependees.set(lastWriter, new Set([id]));
					}
				}

				// register in readers
				if (readers.has(componentTypeId)) {
					readers.get(componentTypeId)!.add(id);
				} else {
					readers.set(componentTypeId, new Set([id]));
				}
			}
			// flag access is Write
			else {
				// add prior readers to dependencies
				if (readers.has(componentTypeId)) {
					const componentReaders = readers.get(componentTypeId)!;

					for (const readerId of componentReaders) {
						if (!dependencies.has(readerId)) {
							dependencies.add(readerId);
						}

						if (jobToDependees.has(readerId)) {
							jobToDependees.get(readerId)!.add(id);
						} else {
							jobToDependees.set(readerId, new Set([id]));
						}
					}
				}
				// add last writer to dependencies
				if (writers.has(componentTypeId)) {
					dependencies.add(writers.get(componentTypeId)!);
				}

				// register as last writer
				writers.set(componentTypeId, id);
			}
		}

		return dependencies;
	}

	private markAsComplete(id: JobId): void {
		const jobToDependees = this.jobToDependees;
		const jobHandles = this.jobHandles;

		// remove from dependees
		if (jobToDependees.has(id)) {
			const dependees = jobToDependees.get(id)!;

			for (const dependee of dependees) {
				if (jobHandles.has(dependee)) {
					const dependeeHandle = jobHandles.get(dependee)!;
					const handleDependencies = dependeeHandle[$dependencies];

					if (handleDependencies) {
						handleDependencies.delete(id);

						if (handleDependencies.size > 0) {
							continue;
						}
					}

					// if 0 dependencies left for dependee - ready to run
					dependeeHandle.complete();
				}
			}

			jobToDependees.delete(id);
		}

		// unregister job
		jobHandles.delete(id);
	}
}
