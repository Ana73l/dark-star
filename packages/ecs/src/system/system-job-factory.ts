import { ComponentQueryDescriptor, ComponentTypesQuery, convertQueryToDescriptors, QueryRecord } from '../query';

import { ECSJobScheduler, ECSJob } from '../threads/ecs-job-scheduler';
import { JobHandle } from '../threads/job';
import {
    EntityLambdaTypes,
    EntityEachLambda,
    EntityEachLambdaWithEntities,
    EntityLambda
} from '../threads/entity-lambda';
import { ComponentType } from '../component';
import { $scheduler } from './planning/__internals__';
import { WorldUpdateVersion } from '../world';

export class SystemLambdaFactory<
    TAll extends ComponentTypesQuery,
    TSome extends ComponentTypesQuery = [],
    TNone extends ComponentType[] = []
> {
    public lastWorldVersion: WorldUpdateVersion = -1;
    public currentJobHandle?: JobHandle;

    private withChanges: boolean = false;

    [$scheduler]?: ECSJobScheduler;

    constructor(private query: QueryRecord<TAll, TSome, TNone>) {}

    public withChangedFilter(): SystemLambdaFactory<TAll, TSome, TNone> {
        this.withChanges = true;

        return this;
    }

    public each<T extends ComponentTypesQuery>(
        accessDescriptors: T,
        lambda: EntityEachLambda<T, TAll, TSome, TNone>
    ): SystemJobFactory<T, TAll, TSome, TNone> {
        return new SystemJobFactory<T, TAll, TSome, TNone>(
            this,
            this.query,
            this.withChanges,
            convertQueryToDescriptors(accessDescriptors),
            EntityLambdaTypes.Each,
            lambda,
            this[$scheduler]
        );
    }

    public eachWithEntities<T extends ComponentTypesQuery>(
        accessDescriptors: T,
        lambda: EntityEachLambdaWithEntities<T, TAll, TSome, TNone>
    ): SystemJobFactory<T, TAll, TSome, TNone> {
        return new SystemJobFactory<T, TAll, TSome, TNone>(
            this,
            this.query,
            this.withChanges,
            convertQueryToDescriptors(accessDescriptors),
            EntityLambdaTypes.EachWithEntities,
            lambda,
            this[$scheduler]
        );
    }
}

export class SystemJobFactory<
    T extends ComponentTypesQuery,
    TAll extends ComponentTypesQuery,
    TSome extends ComponentTypesQuery = [],
    TNone extends ComponentType[] = []
> implements ECSJob<T, TAll, TSome, TNone>
{
    constructor(
        private readonly factory: SystemLambdaFactory<TAll, TSome, TNone>,
        public readonly query: QueryRecord<TAll, TSome, TNone>,
        public withChanges: boolean = false,
        public readonly accessDescriptors: ComponentQueryDescriptor[],
        public readonly lambdaType: EntityLambdaTypes,
        public readonly lambda: EntityLambda<T, TAll, TSome, TNone>,
        private readonly jobScheduler?: ECSJobScheduler
    ) {}

    public withChangedFilter(): SystemJobFactory<T, TAll, TSome, TNone> {
        this.withChanges = true;

        return this;
    }

    public schedule(...dependencies: JobHandle[]): JobHandle {
        if (this.jobScheduler) {
            const jobHandle = this.jobScheduler.scheduleJob(this, dependencies);

            this.factory.currentJobHandle = jobHandle;

            return jobHandle;
        } else {
            return {
                id: 0,
                isComplete: true,
                complete: async () => {}
            };
        }
    }

    public async run(): Promise<void> {
        if (this.jobScheduler) {
            return await this.jobScheduler.scheduleJob(this).complete();
        } else {
        }
    }
}
