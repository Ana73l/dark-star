import { ComponentTypesQuery, ComponentQueryDescriptor, convertQueryToDescriptors } from '../../query';
import { JobHandle } from './job';
import { createNullHandle, Job } from './job';
import { addHandleToSystemDependency } from './ecs-query-job';
import { System } from '../../system';
import { JobScheduler } from '../job-scheduler';

export class ECSJobWithCode<T extends ComponentTypesQuery = []> implements Job {
    private accessDescriptors: ComponentQueryDescriptor[];

    constructor(
        private system: System, 
        private lambda: (...args: any[]) => any,
        private params?: any[], 
        private scheduler?: JobScheduler,
        access?: T
    ) {
        this.accessDescriptors = access ? convertQueryToDescriptors(access) : [];
    }

	public schedule(...dependencies: JobHandle[]): JobHandle {
		if (this.scheduler) {
			const self = this;

			const jobHandle = this.scheduler.scheduleJob(
				self.accessDescriptors,
				async function (taskRunner) {
					await taskRunner.jobWithCode([self.lambda.toString(), self.params]);
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
        this.lambda.call(null, this.params);
	}
}
