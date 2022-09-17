import { Disposable, assert, createUIDGenerator, $id, $view, schemas } from '@dark-star/core';
import { TaskRunner, WorkerPool } from '@dark-star/worker-pool';

import { ComponentType, ComponentTypeId } from '../component';
import {
	ComponentAccessFlags,
	ComponentQueryDescriptor,
	ComponentTypes,
	ComponentTypesQuery,
	convertDescriptorsToQuery,
	queryHasWriter,
	QueryRecord,
} from '../query';

import { $dependencies, JobId, JobHandle } from './job';
import { EntityEachLambda, EntityEachLambdaWithEntities } from './entity-lambda';
import {
	EnqueuedWorkerWorldCommands,
	EntityEachLambdaWorkerParams,
	EntityEachParallelLambdaWorkerParams,
	EntityEachWithEntitiesLambdaWorkerParams,
	EntityEachWithEntitiesParallelLambdaWorkerParams,
	WorkerWorld,
} from './worker-world';
import { DeferredCommandsProcessor } from '../storage/deferred-commands-processor';
import { WorldUpdateVersion } from '../world';

type EntityEachRunner = TaskRunner<EntityEachLambdaWorkerParams, EnqueuedWorkerWorldCommands>;
type EntityEachWithEntitiesRunner = TaskRunner<EntityEachWithEntitiesLambdaWorkerParams, EnqueuedWorkerWorldCommands>;
type EntityEachParallelRunner = TaskRunner<EntityEachParallelLambdaWorkerParams, EnqueuedWorkerWorldCommands>;
type EntityEachWithEntitiesParallelRunner = TaskRunner<EntityEachWithEntitiesParallelLambdaWorkerParams, EnqueuedWorkerWorldCommands>;

export class ECSJobScheduler implements Disposable {
	private readers: Map<ComponentTypeId, Set<JobId>> = new Map();
	private lastWriter: Map<ComponentTypeId, JobId> = new Map();

	private jobToDependees: Map<JobId, Set<JobId>> = new Map();
	private jobHandles: Map<JobId, JobHandle> = new Map();

	private uid: () => number | null = createUIDGenerator();
	private disposed: boolean = false;

	private entityEachRunner: EntityEachRunner;
	private entityEachParallelRunner: EntityEachParallelRunner;
	private entityEachWithEntitiesRunner: EntityEachWithEntitiesRunner;
	private entityEachWithEntitiesParallelRunner: EntityEachWithEntitiesParallelRunner;

	constructor(workerPool: WorkerPool, private deferedCommandsProcessor: DeferredCommandsProcessor) {
		this.entityEachRunner = workerPool.createTask((data: EntityEachLambdaWorkerParams) => {
			// @ts-ignore
			return (world as WorkerWorld).handleEntityEachLambda(data);
		});

		this.entityEachParallelRunner = workerPool.createTask((data: EntityEachParallelLambdaWorkerParams) => {
			// @ts-ignore
			return (worker as WorkerWorld).handleEntityEachParallelLambda(data);
		});

		this.entityEachWithEntitiesRunner = workerPool.createTask((data: EntityEachWithEntitiesLambdaWorkerParams) => {
			// @ts-ignore
			return (world as WorkerWorld).handleEntityEachWithEntitiesLambda(data);
		});

		this.entityEachWithEntitiesParallelRunner = workerPool.createTask((data: EntityEachWithEntitiesParallelLambdaWorkerParams) => {
			// @ts-ignore
			return (world as WorkerWorld).handleEntityEachWithEntitiesParallelLambda(data);
		});
	}

	public scheduleEntityEachLambda<
		T extends ComponentTypesQuery,
		TAll extends ComponentTypes,
		TSome extends ComponentTypes,
		TNone extends ComponentTypes
	>(
		query: QueryRecord<TAll, TSome>,
		accessDescriptors: ComponentQueryDescriptor[],
		lambda: EntityEachLambda<T, TAll, TSome, TNone>,
		currentWorldVersion: WorldUpdateVersion,
		withChanges: boolean = false,
		parallel: boolean = false,
		deps?: JobHandle[]
	): JobHandle {
		const id = this.uid()!;
		const dependencies = this.getDependenciesAndRegisterJob(id, accessDescriptors, deps);

		const layout = new Int32Array(convertDescriptorsToQuery(accessDescriptors).map((type) => type[$id]!));
		const stringifiedLambda = lambda.toString();
		const hasWriter = queryHasWriter(accessDescriptors);

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
						// if change filter is applied and chunk hasn't been written to - skip
						if (withChanges && currentWorldVersion > chunk.worldVersion) {
							continue;
						}

						const componentArrayBuffers: (SharedArrayBuffer | undefined)[] = [];

						for (const componentType of layout) {
							componentArrayBuffers.push(
								chunk.getComponentArray(componentType)?.[$view].buffer as SharedArrayBuffer | undefined
							);
						}

						buffers.push([chunkSize, componentArrayBuffers]);

						if (hasWriter) {
							chunk.worldVersion = currentWorldVersion;
						}
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

				promise = parallel
					? new Promise(async (resolve) => {
							await this.completeJobs(dependencies);

							const tasks: Promise<any>[] = [];

							for (const buffer of buffers) {
								tasks.push(this.entityEachParallelRunner.run([layout, buffer[0], buffer[1], stringifiedLambda]));
							}

							const workerResponses = await Promise.all(tasks);

							for (const commands of workerResponses) {
								this.deferCommands(commands);
							}

							this.markAsComplete(id);

							isComplete = true;

							resolve();
					  })
					: new Promise(async (resolve) => {
							await this.completeJobs(dependencies);

							const commands = await this.entityEachRunner.run([layout, buffers, stringifiedLambda]);

							this.deferCommands(commands);

							this.markAsComplete(id);

							isComplete = true;
							resolve();
					  });

				return promise;
			},
			[$dependencies]: dependencies,
		};
	}

	public scheduleEntityEachWithEntitiesLambda<
		T extends ComponentTypesQuery,
		TAll extends ComponentTypes,
		TSome extends ComponentTypes,
		TNone extends ComponentTypes
	>(
		query: QueryRecord<TAll, TSome, TNone>,
		accessDescriptors: ComponentQueryDescriptor[],
		lambda: EntityEachLambdaWithEntities<T, TAll, TSome, TNone>,
		currentWorldVersion: WorldUpdateVersion,
		withChanges: boolean = false,
		parallel: boolean = false,
		deps?: JobHandle[]
	): JobHandle {
		const id = this.uid()!;
		const dependencies = this.getDependenciesAndRegisterJob(id, accessDescriptors, deps);

		const layout = new Int32Array(convertDescriptorsToQuery(accessDescriptors).map((type) => type[$id]!));
		const stringifiedLambda = lambda.toString();
		const hasWriter = queryHasWriter(accessDescriptors);

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
						// if change filter is applied and chunk hasn't been written to - skip
						if (withChanges && currentWorldVersion > chunk.worldVersion) {
							continue;
						}

						const componentArrayBuffers: (SharedArrayBuffer | undefined)[] = [];

						for (const componentType of layout) {
							componentArrayBuffers.push(
								chunk.getComponentArray(componentType)?.[$view].buffer as SharedArrayBuffer | undefined
							);
						}

						buffers.push([chunkSize, chunk.getEntitiesArray(), componentArrayBuffers]);

						if (hasWriter) {
							chunk.worldVersion = currentWorldVersion;
						}
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

				promise = parallel
					? new Promise(async (resolve) => {
							await this.completeJobs(dependencies);

							const tasks: Promise<any>[] = [];

							for (const buffer of buffers) {
								tasks.push(
									this.entityEachWithEntitiesParallelRunner.run([
										layout,
										buffer[0],
										buffer[1],
										buffer[2],
										stringifiedLambda,
									])
								);
							}
							const workerResponse = await Promise.all(tasks);

							for (const commands of workerResponse) {
								this.deferCommands(commands);
							}

							this.markAsComplete(id);

							isComplete = true;

							resolve();
					  })
					: new Promise(async (resolve) => {
							await this.completeJobs(dependencies);

							const commands = await this.entityEachWithEntitiesRunner.run([layout, buffers, stringifiedLambda]);

							this.deferCommands(commands);

							this.markAsComplete(id);

							isComplete = true;
							resolve();
					  });

				return promise;
			},
			[$dependencies]: dependencies,
		};
	}

	public get isDisposed(): boolean {
		return this.disposed;
	}

	public async completeJobs(jobIds: Set<JobId>): Promise<void> {
		if (jobIds.size > 0) {
			const jobHandles = this.jobHandles;
			const jobs: (() => Promise<void>)[] = [];

			for (const jobId of jobIds) {
				if (jobHandles.has(jobId)) {
					jobs.push(jobHandles.get(jobId)!.complete);
				}
			}

			await Promise.all(jobs);
		}
	}

	public getDependencies(accessDescriptors: ComponentQueryDescriptor[]): Set<JobId> {
		const writers = this.lastWriter;
		const readers = this.readers;
		const dependencies = new Set<JobId>();

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
					}
				}
				// add last writer to dependencies
				if (writers.has(componentTypeId)) {
					dependencies.add(writers.get(componentTypeId)!);
				}
			}
		}

		return dependencies;
	}

	public getDependenciesAndRegisterJob(id: JobId, accessDescriptors: ComponentQueryDescriptor[], initial?: JobHandle[]): Set<JobId> {
		const writers = this.lastWriter;
		const readers = this.readers;
		const jobToDependees = this.jobToDependees;

		const dependencies: Set<JobId> = initial && initial.length > 0 ? new Set(initial.map((handle) => handle.id)) : new Set();

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

	public dispose(): void {
		this.disposed = true;

		this.jobHandles.clear();
		this.jobToDependees.clear();
		this.readers.clear();
		this.lastWriter.clear();
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

	private deferCommands([create, attach, detach, destroy]: EnqueuedWorkerWorldCommands): void {
		for (const [componentTypeIds, instances] of create) {
			if (componentTypeIds) {
				const componentTypes = componentTypeIds.map((id) => schemas[id - 1]);

				if (instances) {
					this.deferedCommandsProcessor.create(componentTypes, instances as any);
				} else {
					this.deferedCommandsProcessor.create(componentTypes);
				}
			} else {
				this.deferedCommandsProcessor.create();
			}
		}

		for (const [entity, componentTypeIds, instances] of attach) {
			const componentTypes = componentTypeIds.map((id) => schemas[id - 1]);

			if (instances) {
				this.deferedCommandsProcessor.attach(entity, componentTypes, instances as any);
			} else {
				this.deferedCommandsProcessor.attach(entity, componentTypes);
			}
		}

		for (const [entity, componentTypeIds] of detach) {
			const componentTypes = componentTypeIds.map((id) => schemas[id - 1]);

			this.deferedCommandsProcessor.detach(entity, componentTypes);
		}

		for (const entity of destroy) {
			this.deferedCommandsProcessor.destroy(entity);
		}
	}
}
