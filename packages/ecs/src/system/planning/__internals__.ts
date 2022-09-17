import { ComponentType } from '../../component';
import { ComponentTypesQuery } from '../../query';
import { JobHandle } from '../../threads';
import { Query } from '../system-job-factory';

export const $planner = Symbol('dark_star_ecs_planner');
export const $queries = Symbol('dark_star_ecs_system_queries');
export const $scheduler = Symbol('dark_star_ecs_job_scheduler');

export interface Planner {
	registerSystemQuery(
		system: System
	): <TAll extends ComponentType[], TSome extends ComponentType[] = [], TNone extends ComponentType[] = []>(
		all: TAll,
		some?: TSome,
		none?: TNone
	) => Query<TAll, TSome, TNone>;
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
}
