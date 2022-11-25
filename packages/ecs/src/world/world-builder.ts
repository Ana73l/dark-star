import { ClassType, Instance } from '@dark-star/core';
import { Factory, InjectableIdentifier, ContainerBuilder, injectable } from '@dark-star/di';

import { SystemType, System } from '../system';

import { World } from './world';
import { ECSWorld } from './ecs-world';

/**
 * Class used to construct and initialize {@link World worlds}.
 */
export class WorldBuilder {
	private systems: SystemType[] = [];
	private threads: number = 0;

	constructor(private containerBuilder: ContainerBuilder = new ContainerBuilder()) {}

	/**
	 * Sets the number of threads to be used by the created {@link World}. 
	 * By default the {@link World} uses a single thread.
	 * 
	 * @param threadsCount - number of threads
	 * @returns The {@link WorldBuilder} instance
	 */
	public useThreads(threadsCount: number = 1): WorldBuilder {
		this.threads = threadsCount;

		return this;
	}

	/**
	 * Registers an {@link injectable} transient provider that can be injected in other providers or systems in the world.
	 * See {@link ContainerBuilder.registerTransient}.
	 * 
	 * @param identifier - Abstract or concrete class serving as {@link injectable} identifier
	 * @param constructor - Concrete class constructor
	 * @returns The {@link WorldBuilder} instance
	 */
	public registerTransient<T>(
		identifier: InjectableIdentifier<T>,
		constructor?: ClassType<T> | Factory<T>
	): WorldBuilder {
		this.containerBuilder.registerTransient(identifier, constructor);

		return this;
	}

	/**
	 * Registers an {@link injectable} singleton provider that can be injected in other providers or systems in the world.
	 * See {@link ContainerBuilder.registerSingleton}.
	 * 
	 * @param identifier - Abstract or concrete class serving as {@link injectable} identifier
	 * @param constructor - Concrete class constructor
	 * @returns The {@link WorldBuilder} instance
	 */
	public registerSingleton<T>(
		identifier: InjectableIdentifier<T>,
		constructor?: ClassType<T> | Factory<T> | Instance<T>
	): WorldBuilder {
		this.containerBuilder.registerSingleton(identifier, constructor);

		return this;
	}

	/**
	 * Registers an {@link injectable} {@link System system} that can be injected in other providers or systems in the world.
	 * 
	 * @param systemType - {@link System} constructor
	 * @returns The {@link WorldBuilder} instance
	 */
	public registerSystem<T extends SystemType>(systemType: T): WorldBuilder {
		this.containerBuilder.registerSingleton(systemType);
		this.systems.push(systemType);

		return this;
	}

	/**
	 * 
	 * @returns The newly created {@link World world}
	 */
	public async build(): Promise<World> {
		return await ECSWorld.create({
			systems: this.systems,
			containerBuilder: this.containerBuilder,
			threads: this.threads,
		});
	}
}
