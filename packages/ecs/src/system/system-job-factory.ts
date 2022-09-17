import { ComponentQueryDescriptor, ComponentTypes, ComponentTypesQuery, convertQueryToDescriptors, QueryRecord } from '../query';
import { WorldUpdateVersion } from '../world';
import { ECSJobScheduler } from '../threads/ecs-job-scheduler';
import { JobHandle } from '../threads/job';
import { EntityEachLambda, EntityEachLambdaWithEntities } from '../threads/entity-lambda';

import { $scheduler } from './planning/__internals__';
import { ECSEachJob } from './ecs-jobs/ecs-each';
import { ECSEachWithEntitiesJob } from './ecs-jobs/ecs-each-with-entities';

export class Query<TAll extends ComponentTypes, TSome extends ComponentTypes = [], TNone extends ComponentTypes = []> {
	public lastWorldVersion: WorldUpdateVersion = -1;
	public currentJobHandle?: JobHandle;

	private withChanges: boolean = false;

	[$scheduler]?: ECSJobScheduler;

	constructor(private query: QueryRecord<TAll, TSome, TNone>) {}

	public withChangedFilter(): Query<TAll, TSome, TNone> {
		this.withChanges = true;

		return this;
	}

	public each<T extends ComponentTypesQuery>(
		accessDescriptors: T,
		lambda: EntityEachLambda<T, TAll, TSome, TNone>
	): ECSEachJob<T, TAll, TSome, TNone> {
		return new ECSEachJob<T, TAll, TSome, TNone>(
			this.query,
			convertQueryToDescriptors(accessDescriptors) as any,
			lambda,
			this.lastWorldVersion,
			this[$scheduler],
			this.withChanges
		);
	}

	public eachWithEntities<T extends ComponentTypesQuery>(
		accessDescriptors: T,
		lambda: EntityEachLambdaWithEntities<T, TAll, TSome, TNone>
	): ECSEachWithEntitiesJob<T, TAll, TSome, TNone> {
		return new ECSEachWithEntitiesJob<T, TAll, TSome, TNone>(
			this.query,
			convertQueryToDescriptors(accessDescriptors) as any,
			lambda,
			this.lastWorldVersion,
			this[$scheduler],
			this.withChanges
		);
	}
}
