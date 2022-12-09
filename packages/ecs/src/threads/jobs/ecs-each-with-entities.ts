import { $id, $view } from '@dark-star/core';
import { ComponentTypesQuery, ComponentTypes, convertDescriptorsToQuery } from '../../query';

import { $scheduler } from '../../system/planning/__internals__';
import { JobHandle, createNullHandle } from './job';
import { ECSQueryJob } from './ecs-query-job';
import { addHandleToSystemDependency, JobParamPayload, mapJobParamsForMainThread, serializeJobParams } from './helpers';

export class ECSEachWithEntitiesJob<
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
				async function (taskRunner) {
					const layout = new Uint32Array(convertDescriptorsToQuery(self.accessDescriptors).map((type) => type[$id]!));
					const lambdaString = self.lambda.toString();

					const buffers: [size: number, entities: SharedArrayBuffer, buffers: (SharedArrayBuffer | undefined)[]][] = [];

					self.iterateChunks((chunk) => {
						const componentArrayBuffers: (SharedArrayBuffer | undefined)[] = [];

						for (const componentType of layout) {
							componentArrayBuffers.push(
								chunk.getComponentArray(componentType)?.[$view].buffer as SharedArrayBuffer | undefined
							);
						}

						buffers.push([chunk.size, chunk.getEntitiesArray().buffer as SharedArrayBuffer, componentArrayBuffers]);
					});

					const commands = await taskRunner.eachWithEntities([layout, buffers, lambdaString, serializedParams]);
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
				async function (taskRunner) {
					const layout = new Uint32Array(convertDescriptorsToQuery(self.accessDescriptors).map((type) => type[$id]!));
					const lambdaString = self.lambda.toString();

					const tasks: Promise<any>[] = [];

					self.iterateChunks((chunk) => {
						const componentArrayBuffers: (SharedArrayBuffer | undefined)[] = [];

						for (const componentType of layout) {
							componentArrayBuffers.push(
								chunk.getComponentArray(componentType)?.[$view].buffer as SharedArrayBuffer | undefined
							);
						}

						tasks.push(
							taskRunner.eachWithEntities([
								layout,
								[[chunk.size, chunk.getEntitiesArray().buffer as SharedArrayBuffer, componentArrayBuffers]],
								lambdaString,
								serializedParams,
							])
						);
					});

					const responses = await Promise.all(tasks);
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
			const entities = chunk.getEntitiesArray();

			for (inLayoutIndex = 0; inLayoutIndex < accessorsCount; inLayoutIndex++) {
				componentsArrayProxy[inLayoutIndex] = chunk.getComponentArray(layout[inLayoutIndex]);
			}

			for (entityIndex = 0; entityIndex < chunkSize; entityIndex++) {
				for (inLayoutIndex = 0; inLayoutIndex < accessorsCount; inLayoutIndex++) {
					componentsProxy[inLayoutIndex] = componentsArrayProxy[inLayoutIndex][entityIndex];
				}

				lambda.call(null, entities[entityIndex], componentsProxy, mappedParams);
			}
		});
	}
}
