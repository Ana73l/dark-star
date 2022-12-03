import { Disposable, Instance, assert } from '@dark-star/core';
import { ComponentAccessFlags, ComponentQueryDescriptor, ComponentTypes, convertQueryToDescriptors } from '../../query';
import { EntityStore } from '../../storage/store';

import { System, SystemGroup, SystemType } from '../system';
import { Planner as IPlanner } from './__internals__';
import { RootSystem } from './root-system';
import { SystemQuery } from '../system-query';

export class Planner implements IPlanner, Disposable {
	private queries: Map<System, [ComponentQueryDescriptor[]]> = new Map();
	private disposed: boolean = false;
	private lambdaFactories: SystemQuery<any, any, any>[] = [];

	constructor(private store: EntityStore, private systems: System[]) {}

	public get isDisposed(): boolean {
		return this.disposed;
	}

	public registerSystemQuery(system: System) {
		return <TAll extends ComponentTypes, TSome extends ComponentTypes, TNone extends ComponentTypes>(
			all: TAll,
			some?: TSome,
			none?: TNone
		): SystemQuery<TAll, TSome, TNone> => {
			const components = convertQueryToDescriptors(all).concat(convertQueryToDescriptors(some || []));

			if (this.queries.has(system)) {
				this.queries.get(system)!.push(components);
			} else {
				this.queries.set(system, [components]);
			}

			const record = this.store.registerQuery(all, some, none);

			const factory = new SystemQuery<TAll, TSome, TNone>(system, record);

			this.lambdaFactories.push(factory);

			return factory;
		};
	}

	public createSystemRoot(): Instance<RootSystem> {
		const { systems, queries } = this;

		const systemInstances = new Map<SystemType, InstanceType<SystemType>>();
		const systemsInGroup = new Map<SystemType<SystemGroup>, System[]>();
		const systemToGroup = new Map<System, SystemType<SystemGroup>>();

		// add root system
		const systemRoot = new RootSystem();
		systemInstances.set(RootSystem, systemRoot);
		systemsInGroup.set(RootSystem, []);

		// split system instances into groups by group type
		for (const system of systems) {
			const systemType = system.constructor as SystemType;

			systemInstances.set(systemType, system);

			let group = systemType?.updateInGroup;

			// if group is not found - assign a group
			if (!group) {
				if ((system as any).systems) {
					group = RootSystem;
				} else {
					group = RootSystem;
				}
			}

			if (systemsInGroup.has(group)) {
				systemsInGroup.get(group)!.push(system);
			} else {
				systemsInGroup.set(group, [system]);
			}

			systemToGroup.set(system, group);
		}

		// add instances into group instances
		for (const systemGroupType of systemsInGroup.keys()) {
			assert(systemInstances.has(systemGroupType), `System group ${systemGroupType.name} not registered in world.`);

			const systemGroup = systemInstances.get(systemGroupType) as SystemGroup;
			const currentSystemsInGroup = systemsInGroup.get(systemGroupType)!;

			// add systems to group
			for (const system of currentSystemsInGroup) {
				systemGroup.systems.push(system);
			}

			// sort systems in group
			systemGroup.systems.sort(
				(systemA, systemB) =>
					calculateOrderByAttributes(systemA, systemB) || calculateOrderByComponentQueries(queries, systemA, systemB)
			);
		}

		systemInstances.clear();
		systemsInGroup.clear();
		systemToGroup.clear();

		return systemRoot;
	}

	public dispose(): void {
		this.queries.clear();

		while (this.systems.length) {
			this.systems.pop();
		}

		while (this.lambdaFactories.length) {
			this.lambdaFactories.pop();
		}
	}
}

export function calculateOrderByAttributes(systemA: System, systemB: System): number {
	const aSystemType = systemA.constructor as SystemType;
	const bSystemType = systemB.constructor as SystemType;

	if (aSystemType?.updateBefore === bSystemType) {
		return -1;
	} else if (aSystemType?.updateAfter === bSystemType) {
		return 1;
	} else if (bSystemType?.updateBefore === aSystemType) {
		return 1;
	} else if (bSystemType?.updateAfter === aSystemType) {
		return -1;
	}

	return 0;
}

export function calculateOrderByComponentQueries(
	queries: Map<System, [ComponentQueryDescriptor[]]>,
	systemA: System,
	systemB: System
): number {
	const firstQueryDescriptors = queries.get(systemA);
	const otherQueryDescriptors = queries.get(systemB);

	if (!firstQueryDescriptors || !otherQueryDescriptors) {
		return 0;
	}

	let result = 0;

	for (const components of firstQueryDescriptors) {
		for (const otherComponents of otherQueryDescriptors) {
			for (const current of components) {
				for (const other of otherComponents) {
					if (current.type === other.type) {
						// if system reads data that later system writes
						// or writes data that later system reads - 2nd is dependent on first
						// if both systems write - they're equal, but still dependent
						if (current.flag === ComponentAccessFlags.Read && other.flag === ComponentAccessFlags.Write) {
							result += -1;
						} else if (current.flag === ComponentAccessFlags.Write && other.flag === ComponentAccessFlags.Read) {
							result += 1;
						} else if (current.flag === ComponentAccessFlags.Write && other.flag === ComponentAccessFlags.Write) {
							result += 1;
						}
					}
				}
			}
		}
	}

	return result;
}
