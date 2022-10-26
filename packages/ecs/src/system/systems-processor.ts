import { Disposable } from '@dark-star/core';

import { JobId } from '../threads';
import { $dependencies } from '../threads/jobs/job';
import { WorldUpdateVersion } from '../world';
import { $queries, $scheduler } from './planning/__internals__';

import { System, SystemGroup } from './system';

export class SystemProcessor implements Disposable {
	private disposed: boolean = false;
	private flattenedSystems: System[];

	constructor(rootSystem: SystemGroup) {
		this.flattenedSystems = rootSystem.flatten();
	}

	public get isDisposed(): boolean {
		return this.disposed;
	}

	public dispose(): void {}

	public async execute(currentWorldVersion: WorldUpdateVersion, deltaT?: number): Promise<void> {
		const systems = this.flattenedSystems;
		const systemsCount = this.flattenedSystems.length;
		let systemIndex;

		for (systemIndex = 0; systemIndex < systemsCount; systemIndex++) {
			const system = systems[systemIndex];

			if (system.active) {
				if (system.ticksSinceLastExecution === system.tickRate) {
					system.lastWorldVersion = currentWorldVersion;

					// if there is a dependency and it's not complete from previous frame - complete it before update
					if (system.dependency && !system.dependency.isComplete) {
						await system.dependency.complete();
					}

					await system.update();

					if (system[$queries].length) {
						const scheduler = system[$queries][0][$scheduler];

						if (scheduler) {
							// merge all jobs scheduled this frame by system into dependencies  for next frame
							const dependencies = new Set<JobId>();

							for (const factory of system[$queries]) {
								if (factory.currentJobHandle) {
									const handle = factory.currentJobHandle;
									const handleDependencies = handle[$dependencies];

									if (!handle.isComplete && handleDependencies && handleDependencies.size > 0) {
										for (const jobId of handleDependencies) {
											dependencies.add(jobId);
										}
									}
								}
							}

							let isComplete = false;
							let promise: Promise<void>;

							system.dependency = {
								id: 0,
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

									const complete = async function (resolve: (value: void | PromiseLike<void>) => void) {
										await scheduler.completeJobs(dependencies);

										isComplete = true;
										resolve();
									};
									promise = new Promise<void>(complete);
								},
							};
						}
					}

					system.ticksSinceLastExecution = 1;
				} else {
					system.ticksSinceLastExecution++;
				}
			}
		}
	}
}
