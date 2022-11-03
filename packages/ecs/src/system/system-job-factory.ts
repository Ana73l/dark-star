import { ComponentTypes, ComponentTypesQuery, convertQueryToDescriptors, QueryRecord } from '../query';
import { WorldUpdateVersion } from '../world';
import { JobScheduler } from '../threads/job-scheduler';
import { Job, JobHandle } from '../threads/jobs/job';
import {
	EntityEachLambda,
	EntityEachLambdaWithEntities,
	EntityEachLambdaWithEntitiesAndParams,
	EntityEachLambdaWithParams,
} from '../threads/entity-lambda';

import { $scheduler } from './planning/__internals__';
import { ECSEachJob } from '../threads/jobs/ecs-each';
import { ECSEachWithEntitiesJob } from '../threads/jobs/ecs-each-with-entities';

export class Query<TAll extends ComponentTypes, TSome extends ComponentTypes = [], TNone extends ComponentTypes = []> {
	public lastWorldVersion: WorldUpdateVersion = -1;
	public currentJobHandle?: JobHandle;

	private withChanges: boolean = false;

	[$scheduler]?: JobScheduler;

	constructor(private query: QueryRecord<TAll, TSome, TNone>) {}

	public withChangedFilter(): Query<TAll, TSome, TNone> {
		this.withChanges = true;

		return this;
	}

	public each<T extends ComponentTypesQuery>(componentAccessDescriptors: T, lambda: EntityEachLambda<T, TAll, TSome, TNone>): Job;
	public each<T extends ComponentTypesQuery, P extends any[]>(
		componentAccessDescriptors: T,
		params: P,
		lambda: EntityEachLambdaWithParams<T, P, TAll, TSome, TNone>
	): Job;
	public each<T extends ComponentTypesQuery, P extends any[]>(
		componentAccessDescriptors: T,
		params: P | EntityEachLambda<T, TAll, TSome, TNone>,
		lambda?: EntityEachLambdaWithParams<T, P, TAll, TSome, TNone>
	): Job {
		if (typeof params === 'function') {
			return new ECSEachJob<T, TAll, TSome, TNone>(
				this.query,
				convertQueryToDescriptors(componentAccessDescriptors) as any,
				params,
				this.lastWorldVersion,
				undefined,
				this[$scheduler],
				this.withChanges
			);
		} else {
			return new ECSEachJob<T, TAll, TSome, TNone>(
				this.query,
				convertQueryToDescriptors(componentAccessDescriptors) as any,
				lambda!,
				this.lastWorldVersion,
				params,
				this[$scheduler],
				this.withChanges
			);
		}
	}

	public eachWithEntities<T extends ComponentTypesQuery>(
		componentAccessDescriptors: T,
		lambda: EntityEachLambdaWithEntities<T, TAll, TSome, TNone>
	): Job;
	public eachWithEntities<T extends ComponentTypesQuery, P extends any[]>(
		componentAccessDescriptors: T,
		params: P,
		lambda: EntityEachLambdaWithEntitiesAndParams<T, P, TAll, TSome, TNone>
	): Job;
	public eachWithEntities<T extends ComponentTypesQuery, P extends any[]>(
		componentAccessDescriptors: T,
		params: P | EntityEachLambdaWithEntities<T, TAll, TSome, TNone>,
		lambda?: EntityEachLambdaWithEntitiesAndParams<T, P, TAll, TSome, TNone>
	): Job {
		if (typeof params === 'function') {
			return new ECSEachWithEntitiesJob<T, TAll, TSome, TNone>(
				this.query,
				convertQueryToDescriptors(componentAccessDescriptors) as any,
				params,
				this.lastWorldVersion,
				undefined,
				this[$scheduler],
				this.withChanges
			);
		} else {
			return new ECSEachWithEntitiesJob<T, TAll, TSome, TNone>(
				this.query,
				convertQueryToDescriptors(componentAccessDescriptors) as any,
				lambda!,
				this.lastWorldVersion,
				params,
				this[$scheduler],
				this.withChanges
			);
		}
	}
}
