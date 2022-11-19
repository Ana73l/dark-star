import { TaskRunner, WorkerPool } from '@dark-star/worker-pool';

import {
	EnqueuedWorkerWorldCommands,
	EntityEachLambdaWorkerParams,
	EntityEachParallelLambdaWorkerParams,
	EntityEachWithEntitiesLambdaWorkerParams,
	EntityEachWithEntitiesParallelLambdaWorkerParams,
	WorkerWorld,
} from './worker-global-scope/worker-world';

type EntityEachRunner = TaskRunner<EntityEachLambdaWorkerParams, EnqueuedWorkerWorldCommands>;
type EntityEachWithEntitiesRunner = TaskRunner<EntityEachWithEntitiesLambdaWorkerParams, EnqueuedWorkerWorldCommands>;
type EntityEachParallelRunner = TaskRunner<EntityEachParallelLambdaWorkerParams, EnqueuedWorkerWorldCommands>;
type EntityEachWithEntitiesParallelRunner = TaskRunner<EntityEachWithEntitiesParallelLambdaWorkerParams, EnqueuedWorkerWorldCommands>;

export class ECSTaskRunner {
	private eachRunner: EntityEachRunner;
	private eachParallelRunner: EntityEachParallelRunner;
	private eachWithEntitiesRunner: EntityEachWithEntitiesRunner;
	private eachWithEntitiesParallelRunner: EntityEachWithEntitiesParallelRunner;

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
	}

	public each(data: EntityEachLambdaWorkerParams): Promise<EnqueuedWorkerWorldCommands> {
		return this.eachRunner.run(data);
	}

	public eachParallel(data: EntityEachParallelLambdaWorkerParams): Promise<EnqueuedWorkerWorldCommands> {
		return this.eachParallelRunner.run(data);
	}

	public eachWithEntities(data: EntityEachWithEntitiesLambdaWorkerParams): Promise<EnqueuedWorkerWorldCommands> {
		return this.eachWithEntitiesRunner.run(data);
	}

	public eachWithEntitiesParallel(data: EntityEachWithEntitiesParallelLambdaWorkerParams): Promise<EnqueuedWorkerWorldCommands> {
		return this.eachWithEntitiesParallelRunner.run(data);
	}
}
