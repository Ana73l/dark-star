import { ComponentType } from '../../component';
import { JobHandle } from '../../threads';
import { JobScheduler } from '../../threads/job-scheduler';
import { SystemQuery } from '../system-query';

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
	start(): void;
	update(): Promise<void>;

	[$planner]?: Planner;
	[$scheduler]?: JobScheduler;
}
