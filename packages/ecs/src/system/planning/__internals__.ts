import { ComponentType } from '../../component/component';
import { ComponentQueryDescriptor } from '../../query';
import { JobHandle } from '../../threads/jobs/job';
import { JobScheduler } from '../../threads/job-scheduler';
import { ComponentLookup } from '../../threads/jobs/job-transferables/component-lookup';
import { ComponentChunksArray } from '../../threads/jobs/job-transferables/component-chunks-array';
import { SystemQuery } from '../query-factories/system-query';

export const $planner = Symbol('dark_star_ecs_planner');
export const $scheduler = Symbol('dark_star_ecs_job_scheduler');

export interface Planner {
	registerSystemQuery(
		system: System
	): <TAll extends ComponentType[], TSome extends ComponentType[] = [], TNone extends ComponentType[] = []>(
		all: TAll,
		some?: TSome,
		none?: TNone
	) => SystemQuery<TAll, TSome, TNone>;
}

export interface System {
	active: boolean;
	dependency?: JobHandle;
	tickRate: number;
	ticksSinceLastExecution: number;
	lastWorldVersion: number;

	init(): void;
	update(): Promise<void>;

	[$planner]?: Planner;
	[$scheduler]?: JobScheduler;
}
