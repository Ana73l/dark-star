import { assert } from '@dark-star/core';

import { ComponentQueryDescriptor, ComponentTypes } from '../query';
import { Job, JobHandle } from '../threads';
import { JobScheduler } from '../threads/job-scheduler';
import { ECSJobWithCode } from '../threads/jobs/ecs-job-with-code';
import { WorldUpdateVersion } from '../world';

import { $planner, $scheduler, Planner, System as ISystem } from './planning/__internals__';
import { SystemQuery } from './system-query';

export type SystemType<T extends System = System> = (new (...args: any[]) => T) & {
	updateBefore?: SystemType;
	updateAfter?: SystemType;
	updateInGroup?: SystemType<SystemGroup>;
	queries?: Record<string, [all: ComponentTypes, some?: ComponentTypes, none?: ComponentTypes]>;
};

export abstract class System implements ISystem {
	/** Indicates whether {@link System system instance} is active for execution */
	public active: boolean = true;
	/**  */
	public tickRate: number = 1;
	/** Used  internally (along with {@link System.active} and {@link System.tickRate} properties) to determine whether system should execute during the current {@link World.step step}. */
	public ticksSinceLastExecution: number = 1;
	public dependency?: JobHandle;
	public lastWorldVersion: WorldUpdateVersion = -1;

	/**
	 * @internal
	 * Injects persistent {@link SystemQuery queries} in the target {@link System system instance} based on its static `queries` property.
	 * Used internally during the {@link World.create world create} phase.
	 * 
	 * @param target - {@link System} instance
	 */
	public static injectQueryInSystemInstance(target: System): void {
		const queries = (target.constructor as SystemType).queries;

		if (queries) {
			for (const [property, query] of Object.entries(queries)) {
				(target as any)[property] = target.query(...query);
			}
		}
	}

	public init() {}

	public start() {}

	public abstract update(): Promise<void>;

	/**
	 * Completes all {@link Job jobs} (if in a {@link WorldBuilder.useThreads multithreaded} {@link World world}) operating on data described with a {@link ComponentQueryDescriptor access descriptor} array.
	 * 
	 * @param componentQueryDescriptors - {@link ComponentQueryDescriptor Access descriptors}
	 * 
	 * @example
	 * ```ts
	 * @injectable()
	 * class ClearRenderingContext extends System {
	 * 	constructor(private context: CanvasRenderingContext2D) {
	 * 		super();
	 * 	}	
	 * 
	 * 	public override update() {
	 * 		// complete jobs on components relevant to rendering before proceeding
	 * 		await this.completeJobs([read(Sprite), read(Position)]);
	 * 		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
	 * 	}
	 * }
	 * ```
	 */
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

	protected jobWithCode(callback: () => void): Job;
	protected jobWithCode<T extends any[]>(params: T, callback: (args: T) => void): Job;
	protected jobWithCode<T extends any[]>(params: T | (() => void), callback?: (args: T) => void): Job {
		if(typeof callback === 'function') {
			return new ECSJobWithCode(
				this,
				callback,
				params as T,
				this[$scheduler]
			);	
		} else {
			return new ECSJobWithCode(
				this,
				params as (args: T) => void,
				[],
				this[$scheduler]
			);
		}
	}

	/**
	 * @internal
	 * {@link JobScheduler} used to schedule jobs. 
	 * Injected only if {@link World world} to which system belongs uses more than one thread.
	 */
	[$scheduler]?: JobScheduler;
	/**
	 * @internal
	 * {@link Planner} used to create {@link SystemQuery queries} and calculate order of systems in a world.
	 * Injected before {@link System.init} is called and removed after to prevent {@link SystemQuery query} registration after {@link System} has been initialized.
	 */
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
