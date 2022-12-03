import { $scheduler, System } from '../../system/planning/__internals__';

import { $dependencies, JobId } from './job';

/**
 * @internal
 * Registers a {@link JobHandle} created by a {@link System} as a dependency to {@link System.dependency}.
 * 
 * @remarks
 * {@link System Systems} need their scheduled {@link Job jobs} from previous {@link World.step step} to be completed before calling {@link System.update}.
 * This utility is used internally to add {@link Job jobs} scheduled by the system to their dependency handle for next {@link System.update}.
 * 
 * @param system - {@link System} from which the {@link Job} handle has been scheduled
 * @param handleId - {@link JobHandle} unique identifier
 */
export const addHandleToSystemDependency = (system: System, handleId: JobId): void => {
	const scheduler = system[$scheduler];
	// only combine dependencies in a threaded environment
	if(scheduler) {
		if(system.dependency) {
			system.dependency[$dependencies]!.add(handleId);
		} else {
			let isComplete = false;
			let promise: Promise<void>;

			system.dependency = {
				id: 0,
				get isComplete() {
					return isComplete;
				},
				complete: async () => {
					if(isComplete) {
						return;
					}

					if(promise) {
						return promise;
					}

					promise = new Promise(async (resolve) => {
						await scheduler.completeJobs(system.dependency![$dependencies]!);

						isComplete = true;
						resolve();							
					});

					return promise;
				},
				[$dependencies]: new Set([handleId])
			}
		}
	}
}