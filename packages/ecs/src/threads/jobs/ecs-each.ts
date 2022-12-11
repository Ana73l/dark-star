import { $id, $view } from '@dark-star/core';
import { ComponentTypesQuery, ComponentTypes, convertDescriptorsToQuery } from '../../query';
import { $scheduler } from '../../system/planning/__internals__';

import { JobHandle, createNullHandle } from './job';
import { ECSQueryJob } from './ecs-query-job';
import {
	addHandleToSystemDependency,
	applyWorkerWorldCommands,
	JobParamPayload,
	mapJobParamsForMainThread,
	serializeJobParams,
	WorkerWorldLambdaResponse,
} from './helpers';

export class ECSEachJob<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypes,
	TSome extends ComponentTypes,
	TNone extends ComponentTypes
> extends ECSQueryJob<T, TAll, TSome, TNone> {
	public schedule(...dependencies: JobHandle[]): JobHandle {
		const scheduler = this.system[$scheduler];

		if (scheduler) {
			const self = this;
			let serializedParams: JobParamPayload | undefined;

			if (self.params) {
				const paramsData = serializeJobParams(self.params);
				serializedParams = paramsData[0];

				self.accessDescriptors = self.accessDescriptors.concat(paramsData[1]);
			}

			const jobHandle = scheduler.scheduleJob(
				this.accessDescriptors,
				async function (taskRunner, deferredCommands) {
					const layout = self.layout;
					const lambdaString = self.lambda.toString();

					const buffers: [size: number, buffers: (SharedArrayBuffer | undefined)[]][] = [];

					self.iterateChunks((chunk) => {
						const componentArrayBuffers: (SharedArrayBuffer | undefined)[] = [];

						for (const componentType of layout) {
							componentArrayBuffers.push(
								chunk.getComponentArray(componentType)?.[$view].buffer as SharedArrayBuffer | undefined
							);
						}

						buffers.push([chunk.size, componentArrayBuffers]);
					});

					const commands = await taskRunner.each([layout, buffers, lambdaString, serializedParams]);

					applyWorkerWorldCommands(deferredCommands, commands);
				},
				dependencies
			);

			addHandleToSystemDependency(this.system, jobHandle.id);

			return jobHandle;
		} else {
			this.execute();

			return createNullHandle();
		}
	}

	public scheduleParallel(...dependencies: JobHandle[]): JobHandle {
		const scheduler = this.system[$scheduler];

		if (scheduler) {
			const self = this;
			let serializedParams: JobParamPayload | undefined;

			if (self.params) {
				const paramsData = serializeJobParams(self.params);
				serializedParams = paramsData[0];

				self.accessDescriptors = self.accessDescriptors.concat(paramsData[1]);
			}

			const jobHandle = scheduler.scheduleJob(
				this.accessDescriptors,
				async function (taskRunner, deferredCommands) {
					const layout = self.layout;
					const lambdaString = self.lambda.toString();

					const tasks: Promise<WorkerWorldLambdaResponse>[] = [];

					self.iterateChunks((chunk) => {
						const componentArrayBuffers: (SharedArrayBuffer | undefined)[] = [];

						for (const componentType of layout) {
							componentArrayBuffers.push(
								chunk.getComponentArray(componentType)?.[$view].buffer as SharedArrayBuffer | undefined
							);
						}

						tasks.push(taskRunner.each([layout, [[chunk.size, componentArrayBuffers]], lambdaString, serializedParams]));
					});

					const responses = await Promise.all(tasks);

					for (const commands of responses) {
						applyWorkerWorldCommands(deferredCommands, commands);
					}
				},
				dependencies
			);

			addHandleToSystemDependency(this.system, jobHandle.id);

			return jobHandle;
		} else {
			this.execute();

			return createNullHandle();
		}
	}

	public async run(): Promise<void> {
		const scheduler = this.system[$scheduler];

		if (scheduler) {
			await scheduler.completeJobs(scheduler.getDependencies(this.accessDescriptors));
		}

		this.execute();
	}

	private execute(): void {
		const mappedParams = this.params ? mapJobParamsForMainThread(this.params) : undefined;
		const layout = this.layout;
		const accessorsCount = layout.length;
		const lambda = this.lambda;
		const componentsProxy = new Array(accessorsCount);
		const componentsArrayProxy = new Array(accessorsCount);
		let inLayoutIndex;
		let entityIndex;

		this.iterateChunks((chunk) => {
			const chunkSize = chunk.size;

			for (inLayoutIndex = 0; inLayoutIndex < accessorsCount; inLayoutIndex++) {
				componentsArrayProxy[inLayoutIndex] = chunk.getComponentArray(layout[inLayoutIndex]);
			}

			for (entityIndex = 0; entityIndex < chunkSize; entityIndex++) {
				for (inLayoutIndex = 0; inLayoutIndex < accessorsCount; inLayoutIndex++) {
					componentsProxy[inLayoutIndex] = componentsArrayProxy[inLayoutIndex][entityIndex];
				}

				lambda.call(null, componentsProxy, mappedParams);
			}
		});
	}
}
