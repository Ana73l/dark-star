import { assert } from '@dark-star/core';

import { ComponentQueryDescriptor, ComponentTypes } from '../query';
import { JobHandle } from '../threads';
import { JobScheduler } from '../threads/job-scheduler';
import { addHandleToSystemDependency } from '../threads/jobs/ecs-query-job';
import { WorldUpdateVersion } from '../world';

import { $planner, $scheduler, Planner, System as ISystem } from './planning/__internals__';
import { SystemQuery } from './system-query';

export type SystemType<T extends System = System> = (new (...args: any[]) => T) & {
	updateBefore?: SystemType;
	updateAfter?: SystemType;
	updateInGroup?: SystemType<SystemGroup>;
	queryFields?: Record<string, [all: ComponentTypes, some?: ComponentTypes, none?: ComponentTypes]>;
};

export abstract class System implements ISystem {
	public active: boolean = true;
	public tickRate: number = 1;
	public ticksSinceLastExecution: number = 1;
	public dependency?: JobHandle;
	public lastWorldVersion: WorldUpdateVersion = -1;

	public static injectQueryInSystemInstance(target: System): void {
		const queries = (target.constructor as SystemType).queryFields;

		if (queries) {
			for (const [property, query] of Object.entries(queries)) {
				(target as any)[property] = target.query(...query);
			}
		}
	}

	public init() {}

	public start() {}

	public abstract update(): Promise<void>;

	protected async completeJobs(componentQueryDescriptors: ComponentQueryDescriptor[]): Promise<void> {
		if (this[$scheduler]) {
			await this[$scheduler].completeJobs(this[$scheduler].getDependencies(componentQueryDescriptors));
		}
	}

	protected query<TAll extends ComponentTypes, TSome extends ComponentTypes = [], TNone extends ComponentTypes = []>(
		all: TAll,
		some?: TSome,
		none?: TNone
	): SystemQuery<TAll, TSome, TNone> {
		assert(
			this[$planner] !== undefined,
			`Error registering query in system ${this.constructor.name}: Cannot register query after system initialization`
		);

		const factory = this[$planner]!.registerSystemQuery(this)<TAll, TSome, TNone>(all, some, none) as any;

		return factory;
	}

	// protected jobWithCode<T extends any[]>(params: T, callback: (args: T) => void): JobHandle {
	// 	addHandleToSystemDependency(this, jobHandle.id);
	// }

	[$scheduler]?: JobScheduler;
	[$planner]?: Planner;
}

export abstract class SystemGroup extends System {
	public readonly systems: System[] = [];

	public override async update(): Promise<void> {}

	public flatten(): (System | SystemGroup)[] {
		const systemsInGroup = this.systems;
		const systems = [];

		for (const system of systemsInGroup) {
			systems.push(system);

			if (Reflect.has(system, 'systems')) {
				systems.push(...(system as SystemGroup).flatten());
			}
		}

		return systems;
	}
}
