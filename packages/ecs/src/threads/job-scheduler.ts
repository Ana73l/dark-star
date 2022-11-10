import { Disposable, createUIDGenerator, $id } from '@dark-star/core';

import { ComponentTypeId } from '../component';
import { ComponentAccessFlags, ComponentQueryDescriptor } from '../query';
import { ECSTaskRunner } from './ecs-task-runner';

import { $dependencies, JobId, JobHandle, $readers, $writers } from './jobs/job';

export class JobScheduler implements Disposable {
	private readers: Map<ComponentTypeId, Set<JobId>> = new Map();
	private lastWriter: Map<ComponentTypeId, JobId> = new Map();

	private jobToDependees: Map<JobId, Set<JobId>> = new Map();
	private jobHandles: Map<JobId, JobHandle> = new Map();

	private uid: () => number | null = createUIDGenerator();
	private disposed: boolean = false;

	constructor(private taskRunner: ECSTaskRunner) {}

	public scheduleJob(
		accessDescriptors: ComponentQueryDescriptor[],
		complete: (taskRunner: ECSTaskRunner) => Promise<void>,
		deps?: JobHandle[]
	): JobHandle {
		const id = this.uid()!;
		const writers = this.lastWriter;
		const readers = this.readers;
		const dependencies: Set<JobId> = deps && deps.length > 0 ? new Set(deps.map((handle) => handle.id)) : new Set();
		const jobReaders: ComponentTypeId[] = [];
		const jobWriters: ComponentTypeId[] = [];
		console.log('schedule', id, accessDescriptors);
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
				// register to readers
				if (readers.has(componentTypeId)) {
					readers.get(componentTypeId)!.add(id);
				} else {
					readers.set(componentTypeId, new Set([id]));
				}
				// register to job readers
				jobReaders.push(componentTypeId);
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
				// register as last writer
				writers.set(componentTypeId, id);
				// register to job writers
				jobWriters.push(componentTypeId);
			}
		}

		const self = this;

		let isComplete = false;
		let promise: Promise<void>;

		const jobHandle = {
			get id() {
				return id;
			},
			get isComplete() {
				return isComplete;
			},
			complete: async function () {
				if (isComplete) {
					return;
				}

				if (promise) {
					return promise;
				}

				promise = new Promise(async function (resolve) {
					await self.completeJobs(dependencies);

					await complete(self.taskRunner);

					isComplete = true;

					self.markAsComplete(id);
					console.log('complete', id);

					resolve();
				});

				return promise;
			},
			[$dependencies]: dependencies,
			[$readers]: jobReaders,
			[$writers]: jobWriters,
		};

		this.jobHandles.set(id, jobHandle);

		return jobHandle;
	}

	public get isDisposed(): boolean {
		return this.disposed;
	}

	public async completeJobs(jobIds: Set<JobId>): Promise<void> {
		if (jobIds.size > 0) {
			const jobHandles = this.jobHandles;
			const jobs = [];

			for (const jobId of jobIds) {
				if (jobHandles.has(jobId)) {
					const handle = jobHandles.get(jobId)!;

					if (!handle.isComplete) {
						jobs.push(jobHandles.get(jobId)!.complete());
					}
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
		const readers = this.readers;
		const lastWriters = this.lastWriter;
		const handle = jobHandles.get(id);
		console.log('markAsComplete', id, handle);
		if (handle) {
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

			// remove from readers and last writers
			const handleReaders = handle?.[$readers];
			const handleWriters = handle?.[$writers];

			if (handleReaders) {
				for (const reader of handleReaders) {
					readers.get(reader)?.delete(id);
				}
			}
			if (handleWriters) {
				for (const writer of handleWriters) {
					const lastHandleWriting = lastWriters.get(writer);

					if (lastHandleWriting === id) {
						lastWriters.delete(writer);
					}
				}
			}

			// unregister job
			jobHandles.delete(id);
		}
	}
}
