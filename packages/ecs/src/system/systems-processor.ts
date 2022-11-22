import { Disposable } from '@dark-star/core';

import { WorldUpdateVersion } from '../world';

import { System, SystemGroup } from './system';

export class SystemProcessor implements Disposable {
	private disposed: boolean = false;
	private flattenedSystems: System[];

	constructor(rootSystem: SystemGroup) {
		this.flattenedSystems = rootSystem.flatten();
	}

	public get isDisposed(): boolean {
		return this.disposed;
	}

	public dispose(): void {
		const systems = this.flattenedSystems;

		while(systems.length > 0) {
			systems.pop();
		}
		
		this.disposed = true;
	}

	public async execute(currentWorldVersion: WorldUpdateVersion): Promise<void> {
		const systems = this.flattenedSystems;
		const systemsCount = this.flattenedSystems.length;
		let systemIndex;

		for (systemIndex = 0; systemIndex < systemsCount; systemIndex++) {
			const system = systems[systemIndex];

			if (system.active) {
				if (system.ticksSinceLastExecution === system.tickRate) {
					system.lastWorldVersion = currentWorldVersion;

					// if there is a dependency and it's not complete from previous tick - complete it before update
					if (system.dependency && !system.dependency.isComplete) {
						await system.dependency.complete();
					}

					// remove dependency from last tick after completion
					system.dependency = undefined;

					await system.update();

					system.ticksSinceLastExecution = 1;
				} else {
					system.ticksSinceLastExecution++;
				}
			}
		}
	}
}
