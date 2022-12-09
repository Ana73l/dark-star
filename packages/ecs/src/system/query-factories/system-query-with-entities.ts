import { ComponentTypes, ComponentTypesQuery } from '../../query';
import { EntityEachLambdaWithEntities } from '../../threads/entity-lambda';
import { ECSEachWithEntitiesJob } from '../../threads/jobs/ecs-each-with-entities';
import { ParallelJob, JobArgs } from '../../threads/jobs/job';

import { SystemQueryBase } from './system-query-base';

export class SystemQueryWithEntities<
	TAll extends ComponentTypes,
	TSome extends ComponentTypes = [],
	TNone extends ComponentTypes = []
> extends SystemQueryBase<TAll, TSome, TNone> {
	public each<T extends ComponentTypesQuery>(
		componentAccessDescriptors: T,
		lambda: EntityEachLambdaWithEntities<T, TAll, TSome, TNone, undefined>
	): ParallelJob;
	public each<T extends ComponentTypesQuery, P extends JobArgs>(
		componentAccessDescriptors: T,
		params: P,
		lambda: EntityEachLambdaWithEntities<T, TAll, TSome, TNone, P>
	): ParallelJob;
	public each<T extends ComponentTypesQuery, P extends JobArgs>(
		componentAccessDescriptors: T,
		params: P | EntityEachLambdaWithEntities<T, TAll, TSome, TNone, undefined>,
		lambda?: EntityEachLambdaWithEntities<T, TAll, TSome, TNone, P>
	): ParallelJob {
		if (typeof params === 'function') {
			return new ECSEachWithEntitiesJob<T, TAll, TSome, TNone>(
				this.system,
				this.query,
				componentAccessDescriptors,
				params,
				undefined,
				this.withChanges
			);
		} else {
			return new ECSEachWithEntitiesJob<T, TAll, TSome, TNone>(
				this.system,
				this.query,
				componentAccessDescriptors,
				lambda!,
				params,
				this.withChanges
			);
		}
	}
}
