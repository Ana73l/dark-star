import { assert } from '@dark-star/core';

import { ComponentType } from '../component';
import { ComponentTypesQuery } from '../query';
import { JobHandle } from '../threads';
import { WorldUpdateVersion } from '../world';

import { $planner, $queries, Planner, System as ISystem } from './planning/__internals__';
import { SystemLambdaFactory } from './system-job-factory';

export type SystemType<T extends System = System> = (new (...args: any[]) => T) & {
	updateBefore?: SystemType;
	updateAfter?: SystemType;
	updateInGroup?: SystemType<SystemGroup>;
	queryFields?: Record<string, [all: ComponentTypesQuery, some?: ComponentTypesQuery, none?: ComponentType[]]>;
};

export abstract class System implements ISystem {
	public active: boolean = true;
	public tickRate: number = 1;
	public ticksSinceLastExecution: number = 1;
	public dependency?: JobHandle;
	private _lastWorldVersion: WorldUpdateVersion = -1;

	public static injectQueryInSystemInstance(target: System): void {
		const queries = (target.constructor as SystemType).queryFields;

		if (queries) {
			for (const [property, query] of Object.entries(queries)) {
				(target as any)[property] = target.query(...query);
			}
		}
	}

	public set lastWorldVersion(newVersion: WorldUpdateVersion) {
		this._lastWorldVersion = newVersion;

		const jobFactories = this[$queries];

		for (const factory of jobFactories) {
			factory.lastWorldVersion = newVersion;
		}
	}

	public get lastWorldVersion(): WorldUpdateVersion {
		return this._lastWorldVersion;
	}

	public init() {}

	public start() {}

	public abstract update(): Promise<void>;

	protected query<
		TAll extends ComponentTypesQuery,
		TSome extends ComponentTypesQuery = [],
		TNone extends ComponentType[] = []
	>(all: TAll, some?: TSome, none?: TNone) {
		assert(
			this[$planner] !== undefined,
			`Error registering query in system ${this.constructor.name}: cannot register query after system initialization`
		);

		const factory = this[$planner]!.registerSystemQuery(this)<TAll, TSome, TNone>(all, some, none);

		this[$queries].push(factory);

		return factory;
	}

	[$planner]: Planner | undefined;
	[$queries]: SystemLambdaFactory<ComponentType[], ComponentType[], ComponentType[]>[] = [];
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
