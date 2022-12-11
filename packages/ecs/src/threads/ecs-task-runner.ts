import { Definition } from '@dark-star/core';
import { TaskRunner, WorkerPool } from '@dark-star/worker-pool';

import { WorkerWorldLambdaResponse } from './jobs/helpers';
import {
	EntityEachLambdaWorkerParams,
	EntityEachWithEntitiesLambdaWorkerParams,
	JobWithCodeLambdaWorkerParams,
	WorkerWorld,
} from './worker-global-scope/worker-world';

type EntityEachRunner = TaskRunner<EntityEachLambdaWorkerParams, WorkerWorldLambdaResponse>;
type EntityEachWithEntitiesRunner = TaskRunner<EntityEachWithEntitiesLambdaWorkerParams, WorkerWorldLambdaResponse>;
type RegisterSchemasRunner = TaskRunner<[string, Definition | undefined][], void>;
type JobWithCodeRunner = TaskRunner<JobWithCodeLambdaWorkerParams, WorkerWorldLambdaResponse>;

export class ECSTaskRunner {
	private eachRunner: EntityEachRunner;
	private eachWithEntitiesRunner: EntityEachWithEntitiesRunner;
	private jobWithCodeRunner: JobWithCodeRunner;
	private registerSchemasRunner: RegisterSchemasRunner;

	constructor(pool: WorkerPool) {
		this.eachRunner = pool.createTask((data: EntityEachLambdaWorkerParams) => {
			// @ts-ignore
			return (world as WorkerWorld).handleEntityEachLambda(data);
		});

		this.eachWithEntitiesRunner = pool.createTask((data: EntityEachWithEntitiesLambdaWorkerParams) => {
			// @ts-ignore
			return (world as WorkerWorld).handleEntityEachWithEntitiesLambda(data);
		});

		this.jobWithCodeRunner = pool.createTask((data: JobWithCodeLambdaWorkerParams) => {
			// @ts-ignore
			return (world as WorkerWorld).handleJobWithCode(data);
		});

		this.registerSchemasRunner = pool.createTask((data: [string, Definition | undefined][]) => {
			// @ts-ignore
			(world as WorkerWorld).registerSchemas(data);
		});
	}

	public each(data: EntityEachLambdaWorkerParams): Promise<WorkerWorldLambdaResponse> {
		return this.eachRunner.run(data);
	}

	public eachWithEntities(data: EntityEachWithEntitiesLambdaWorkerParams): Promise<WorkerWorldLambdaResponse> {
		return this.eachWithEntitiesRunner.run(data);
	}

	public jobWithCode(data: JobWithCodeLambdaWorkerParams): Promise<WorkerWorldLambdaResponse> {
		return this.jobWithCodeRunner.run(data);
	}

	public registerSchemas(data: [string, Definition | undefined][]): Promise<void> {
		return this.registerSchemasRunner.run(data);
	}
}
