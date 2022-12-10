import { ComponentType } from '../../component/component';
import { JobHandle } from '../../threads';
import { JobScheduler } from '../../threads/job-scheduler';
import { ComponentLookup } from '../../threads/jobs/job-transferables/component-lookup';
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

	getComponentLookup<T extends ComponentType = ComponentType, R extends boolean = false>(
		componentType: T,
		readonly?: R
	): ComponentLookup<T, R>;
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
