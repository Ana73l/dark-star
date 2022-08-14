import { ClassType, Instance } from '@dark-star/core';
import { Factory, InjectableIdentifier, ContainerBuilder } from '@dark-star/di';

import { SystemType } from '../system';

import { World } from './world';
import { ECSWorld } from './ecs-world';

export class WorldBuilder {
	private systems: SystemType[] = [];
	private threads: number = 0;

	constructor(private containerBuilder: ContainerBuilder = new ContainerBuilder()) {}

	public useThreads(threadsCount: number = 1): WorldBuilder {
		this.threads = threadsCount;

		return this;
	}

	public registerTransient<T>(
		identifier: InjectableIdentifier<T>,
		constructor?: ClassType<T> | Factory<T>
	): WorldBuilder {
		this.containerBuilder.registerTransient(identifier, constructor);

		return this;
	}

	public registerSingleton<T>(
		identifier: InjectableIdentifier<T>,
		constructor?: ClassType<T> | Factory<T> | Instance<T>
	): WorldBuilder {
		this.containerBuilder.registerSingleton(identifier, constructor);

		return this;
	}

	public registerSystem<T extends SystemType>(systemType: T): WorldBuilder {
		this.containerBuilder.registerSingleton(systemType);
		this.systems.push(systemType);

		return this;
	}

	public async build(): Promise<World> {
		return await ECSWorld.create({
			systems: this.systems,
			containerBuilder: this.containerBuilder,
			threads: this.threads,
		});
	}
}
