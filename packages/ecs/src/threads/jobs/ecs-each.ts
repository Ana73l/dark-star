import { $id, $view, schemas } from '@dark-star/core';
import { ComponentTypesQuery, ComponentTypes, convertDescriptorsToQuery } from '../../query';
import { JobHandle } from '..';
import { createNullHandle } from './job';
import { ECSQueryJob } from './ecs-query-job';

export class ECSEachJob<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypes,
	TSome extends ComponentTypes,
	TNone extends ComponentTypes
> extends ECSQueryJob<T, TAll, TSome, TNone> {
	public schedule(...dependencies: JobHandle[]): JobHandle {
		if (this.scheduler) {
			const self = this;

			return this.scheduler.scheduleJob(
				this.accessDescriptors,
				async function (taskRunner) {
					const layout = new Int32Array(convertDescriptorsToQuery(self.accessDescriptors).map((type) => type[$id]!));
					const lambdaString = self.lambda.toString();

					const buffers: [size: number, buffers: (SharedArrayBuffer | undefined)[]][] = [];

					self.iterateChunks((chunk) => {
						const componentArrayBuffers: (SharedArrayBuffer | undefined)[] = [];

						for (const componentType of layout) {
							componentArrayBuffers.push(
								chunk.getComponentArray(componentType)?.[$view].buffer as SharedArrayBuffer | undefined
							);
							if (componentType === 2) {
								const b = chunk.getComponentArray(componentType)![$view].buffer!;
								console.log(chunk.getComponentArray(componentType)![0].constructor.name);
								console.log(chunk.getComponentArray(componentType)![0]);
								console.log(new Uint8Array(b));
							}
						}

						buffers.push([chunk.size, componentArrayBuffers]);
					});

					const commands = await taskRunner.each([layout, buffers, lambdaString]);
				},
				dependencies
			);
		} else {
			this.execute();

			return createNullHandle();
		}
	}

	public scheduleParallel(...dependencies: JobHandle[]): JobHandle {
		if (this.scheduler) {
			const self = this;

			return this.scheduler.scheduleJob(
				this.accessDescriptors,
				async function (taskRunner) {
					const layout = new Int32Array(convertDescriptorsToQuery(self.accessDescriptors).map((type) => type[$id]!));
					const lambdaString = self.lambda.toString();

					const tasks: Promise<any>[] = [];

					self.iterateChunks((chunk) => {
						const componentArrayBuffers: (SharedArrayBuffer | undefined)[] = [];

						for (const componentType of layout) {
							componentArrayBuffers.push(
								chunk.getComponentArray(componentType)?.[$view].buffer as SharedArrayBuffer | undefined
							);
						}

						tasks.push(taskRunner.eachParallel([layout, chunk.size, componentArrayBuffers, lambdaString]));
					});

					const responses = await Promise.all(tasks);
				},
				dependencies
			);
		} else {
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
		const layout = this.accessDescriptors.map((descriptor) => descriptor.type[$id]!);
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

				lambda.call(null, componentsProxy, this.params);
			}
		});
	}
}
