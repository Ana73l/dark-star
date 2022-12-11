import { ComponentTypesQuery, ComponentQueryDescriptor, convertQueryToDescriptors } from '../../query';
import { System } from '../../system';
import { JobScheduler } from '../job-scheduler';

import { createNullHandle, Job, JobHandle } from './job';
import {
	addHandleToSystemDependency,
	applyWorkerWorldCommands,
	JobParamPayload,
	mapJobParamsForMainThread,
	serializeJobParams,
} from './helpers';

export class ECSJobWithCode implements Job {
	private accessDescriptors: ComponentQueryDescriptor[];

	constructor(
		private system: System,
		private lambda: (...args: any[]) => any,
		private params?: any[],
		private scheduler?: JobScheduler,
		access?: ComponentTypesQuery
	) {
		this.accessDescriptors = access ? convertQueryToDescriptors(access) : [];
	}

	public schedule(...dependencies: JobHandle[]): JobHandle {
		if (this.scheduler) {
			const self = this;
			let serializedParams: JobParamPayload | undefined;

			if (self.params) {
				const paramsData = serializeJobParams(self.params);
				serializedParams = paramsData[0];

				self.accessDescriptors = self.accessDescriptors.concat(paramsData[1]);
			}

			const jobHandle = this.scheduler.scheduleJob(
				self.accessDescriptors,
				async function (taskRunner, deferredCommands) {
					const commands = await taskRunner.jobWithCode([self.lambda.toString(), serializedParams]);

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

	public async run(): Promise<void> {
		if (this.scheduler) {
			await this.scheduler.completeJobs(this.scheduler.getDependencies(this.accessDescriptors));
		}

		this.execute();
	}

	private execute(): void {
		const mappedParams = this.params ? mapJobParamsForMainThread(this.params) : undefined;

		this.lambda.call(null, mappedParams);
	}
}
