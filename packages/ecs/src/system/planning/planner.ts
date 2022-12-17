import { Disposable, Instance, assert } from '@dark-star/core';

import { ComponentAccessFlags, ComponentQueryDescriptor, ComponentTypes, convertQueryToDescriptors } from '../../query';
import { EntityStore } from '../../storage/store';

import { System, SystemGroup, SystemType } from '../system';
import { SystemQuery } from '../query-factories/system-query';

import { Planner as IPlanner } from './__internals__';
import { RootSystem } from './root-system';

export class Planner implements IPlanner, Disposable {
	private disposed: boolean = false;

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
			const record = this.store.registerQuery(all, some, none);

			return new SystemQuery<TAll, TSome, TNone>(system, record);
		};
	}

	public createSystemRoot(): Instance<RootSystem> {
		const { systems } = this;

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

			let group = systemType?.updateInGroup || RootSystem;

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
			const currentSystemsInGroup = systemsInGroup.get(systemGroupType) || [];
			// used for ordering update order of systems based on their updateBefore and updateAfter attributes
			const systemToPrerequisiteSystem = new Map<SystemType, Set<SystemType>>();

			// set prerequisite systems
			for (const system of currentSystemsInGroup) {
				// set prerequisites
				const systemType = system.constructor as SystemType;
				const updateAfterSystemType = systemType.updateAfter;
				const updateBeforeSystemType = systemType.updateBefore;

				if (!systemToPrerequisiteSystem.has(systemType)) {
					systemToPrerequisiteSystem.set(systemType, new Set());
				}

				if (updateAfterSystemType && systemType.updateInGroup === updateAfterSystemType.updateInGroup) {
					systemToPrerequisiteSystem.get(systemType)!.add(updateAfterSystemType);
				}

				if (updateBeforeSystemType && systemType.updateInGroup === updateBeforeSystemType.updateInGroup) {
					if (systemToPrerequisiteSystem.has(updateBeforeSystemType)) {
						systemToPrerequisiteSystem.get(updateBeforeSystemType)!.add(systemType);
					} else {
						systemToPrerequisiteSystem.set(updateBeforeSystemType, new Set([systemType]));
					}
				}
			}

			const addedSystems = new Set<System>();

			for (const system of currentSystemsInGroup) {
				addSystemToGroup(system, systemToPrerequisiteSystem, systemInstances, addedSystems, systemGroup.systems);
			}

			systemToPrerequisiteSystem.clear();
			addedSystems.clear();
		}

		systemInstances.clear();
		systemsInGroup.clear();
		systemToGroup.clear();

		return systemRoot;
	}

	public dispose(): void {
		while (this.systems.length) {
			this.systems.pop();
		}
	}
}

function addSystemToGroup(
	system: System,
	prerequisites: Map<SystemType, Set<SystemType>>,
	systemInstances: Map<SystemType, InstanceType<SystemType>>,
	addedSystems: Set<System>,
	result: System[] = []
): void {
	const systemType = system.constructor as SystemType;

	if (prerequisites.has(systemType)) {
		const priorSystemTypes = prerequisites.get(systemType)!;
		for (const priorSystemType of priorSystemTypes) {
			addSystemToGroup(systemInstances.get(priorSystemType)!, prerequisites, systemInstances, addedSystems, result);
		}
	}

	if (!addedSystems.has(system)) {
		addedSystems.add(system);

		result.push(system);
	}
}
