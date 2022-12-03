import { Definition } from '@dark-star/core';
import { TaskRunner, WorkerPool } from '@dark-star/worker-pool';

import {
	EntityEachLambdaWorkerParams,
	EntityEachParallelLambdaWorkerParams,
	EntityEachWithEntitiesLambdaWorkerParams,
	EntityEachWithEntitiesParallelLambdaWorkerParams,
	JobWithCodeLambdaWorkerParams,
	WorkerWorld,
} from './worker-global-scope/worker-world';

type EntityEachRunner = TaskRunner<EntityEachLambdaWorkerParams, void>;
type EntityEachWithEntitiesRunner = TaskRunner<EntityEachWithEntitiesLambdaWorkerParams, void>;
type EntityEachParallelRunner = TaskRunner<EntityEachParallelLambdaWorkerParams, void>;
type EntityEachWithEntitiesParallelRunner = TaskRunner<EntityEachWithEntitiesParallelLambdaWorkerParams, void>;
type RegisterSchemasRunner = TaskRunner<[string, Definition | undefined][], void>;
type JobWithCodeRunner = TaskRunner<JobWithCodeLambdaWorkerParams, void>;

export class ECSTaskRunner {
	private eachRunner: EntityEachRunner;
	private eachParallelRunner: EntityEachParallelRunner;
	private eachWithEntitiesRunner: EntityEachWithEntitiesRunner;
	private eachWithEntitiesParallelRunner: EntityEachWithEntitiesParallelRunner;
	private jobWithCodeRunner: JobWithCodeRunner;
	private registerSchemasRunner: RegisterSchemasRunner;

	constructor(pool: WorkerPool) {
		this.eachRunner = pool.createTask((data: EntityEachLambdaWorkerParams) => {
			// @ts-ignore
			return (world as WorkerWorld).handleEntityEachLambda(data);
		});

		this.eachParallelRunner = pool.createTask((data: EntityEachParallelLambdaWorkerParams) => {
			// @ts-ignore
			return (worker as WorkerWorld).handleEntityEachParallelLambda(data);
		});

		this.eachWithEntitiesRunner = pool.createTask((data: EntityEachWithEntitiesLambdaWorkerParams) => {
			// @ts-ignore
			return (world as WorkerWorld).handleEntityEachWithEntitiesLambda(data);
		});

		this.eachWithEntitiesParallelRunner = pool.createTask((data: EntityEachWithEntitiesParallelLambdaWorkerParams) => {
			// @ts-ignore
			return (world as WorkerWorld).handleEntityEachWithEntitiesParallelLambda(data);
		});

		this.jobWithCodeRunner = pool.createTask((data: JobWithCodeLambdaWorkerParams) => {
			// @ts-ignore
			return (world as WorkerWorld).handleJobWithCode(data);
		});

		this.registerSchemasRunner = pool.createTask((data: [string, Definition | undefined][]) => {
			// @ts-ignore
			(world as WorkerWorld).registerSchemas(data);
		})
	}

	public each(data: EntityEachLambdaWorkerParams): Promise<void> {
		return this.eachRunner.run(data);
	}

	public eachParallel(data: EntityEachParallelLambdaWorkerParams): Promise<void> {
		return this.eachParallelRunner.run(data);
	}

	public eachWithEntities(data: EntityEachWithEntitiesLambdaWorkerParams): Promise<void> {
		return this.eachWithEntitiesRunner.run(data);
	}

	public eachWithEntitiesParallel(data: EntityEachWithEntitiesParallelLambdaWorkerParams): Promise<void> {
		return this.eachWithEntitiesParallelRunner.run(data);
	}

	public jobWithCode(data: JobWithCodeLambdaWorkerParams): Promise<void> {
		return this.jobWithCodeRunner.run(data);
	}

	public registerSchemas(data: [string, Definition | undefined][]): Promise<void> {
		return this.registerSchemasRunner.run(data);
	}
}
