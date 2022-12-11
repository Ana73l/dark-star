import { ClassType, Instance } from '@dark-star/core';
import { Factory, InjectableIdentifier, ContainerBuilder } from '@dark-star/di';

import { SystemType } from '../system';

import { World } from './world';
import { ECSWorld } from './ecs-world';

/**
 * Used to construct and initialize {@link World worlds}.
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
	 * Registers an {@link  @dark-star/di!injectable} transient provider that can be injected in other providers or systems in the world.
	 * @see {@link @dark-star/di!ContainerBuilder.registerTransient}.
	 * 
	 * @param constructor - Concrete class constructor serving both as {@link  @dark-star/di!injectable} identifier and transient initializer
	 * @returns The {@link WorldBuilder} instance
	 */
	 public registerTransient<T>(
		constructor: ClassType<T>
	): WorldBuilder;
	/**
	 * Registers an {@link  @dark-star/di!injectable} transient provider that can be injected in other providers or systems in the world.
	 * @see {@link  @dark-star/di!ContainerBuilder.registerTransient}.
	 * 
	 * @param identifier - Abstract or concrete class serving as {@link  @dark-star/di!injectable} identifier
	 * @param constructor - Concrete class constructor
	 * @returns The {@link WorldBuilder} instance
	 */
	 public registerTransient<T>(
		identifier: InjectableIdentifier<T>,
		constructor: ClassType<T>
	): WorldBuilder;
	/**
	 * Registers an {@link  @dark-star/di!injectable} transient provider that can be injected in other providers or systems in the world.
	 * @see {@link  @dark-star/di!ContainerBuilder.registerTransient}.
	 * 
	 * @param identifier - Abstract or concrete class serving as {@link  @dark-star/di!injectable} identifier
	 * @param factory - Function with no parameters which returns an object that implements the identifier parameter
	 * @returns The {@link WorldBuilder} instance
	 */
	 public registerTransient<T>(
		identifier: InjectableIdentifier<T>,
		factory: Factory<T>
	): WorldBuilder;
	public registerTransient<T>(
		identifier: InjectableIdentifier<T>,
		constructor?: ClassType<T> | Factory<T>
	): WorldBuilder {
		this.containerBuilder.registerTransient(identifier, constructor);

		return this;
	}

	/**
	 * Registers an {@link  @dark-star/di!injectable} singleton provider that can be injected in other providers or systems in the world.
	 * @see {@link  @dark-star/di!ContainerBuilder.registerSingleton}.
	 * 
	 * @param constructor - Concrete class constructor serving both as {@link  @dark-star/di!injectable} identifier and singleton initializer
	 * @returns The {@link WorldBuilder} instance
	 */
	 public registerSingleton<T>(
		constructor: ClassType<T>
	): WorldBuilder;
	/**
	 * Registers an {@link  @dark-star/di!injectable} singleton provider that can be injected in other providers or systems in the world.
	 * @see {@link  @dark-star/di!ContainerBuilder.registerSingleton}.
	 * 
	 * @param identifier - Abstract or concrete class serving as {@link  @dark-star/di!injectable} identifier
	 * @param constructor - Concrete class constructor
	 * @returns The {@link WorldBuilder} instance
	 */
	 public registerSingleton<T>(
		identifier: InjectableIdentifier<T>,
		constructor: ClassType<T>
	): WorldBuilder;
	/**
	 * Registers an {@link  @dark-star/di!injectable} singleton provider that can be injected in other providers or systems in the world.
	 * @see {@link  @dark-star/di!ContainerBuilder.registerSingleton}.
	 * 
	 * @param identifier - Abstract or concrete class serving as {@link  @dark-star/di!injectable} identifier
	 * @param factory - Function with no parameters which returns an object that implements the identifier parameter
	 * @returns The {@link WorldBuilder} instance
	 */
	 public registerSingleton<T>(
		identifier: InjectableIdentifier<T>,
		factory: Factory<T>
	): WorldBuilder;
	/**
	 * Registers an {@link  @dark-star/di!injectable} singleton provider that can be injected in other providers or systems in the world.
	 * @see {@link  @dark-star/di!ContainerBuilder.registerSingleton}.
	 * 
	 * @param identifier - Abstract or concrete class serving as {@link  @dark-star/di!injectable} identifier
	 * @param instance - Object that implements {@link identifier}
	 * @returns The {@link WorldBuilder} instance
	 */
	 public registerSingleton<T>(
		identifier: InjectableIdentifier<T>,
		instance: Instance<T>
	): WorldBuilder;
	public registerSingleton<T>(
		identifier: InjectableIdentifier<T>,
		constructor?: ClassType<T> | Factory<T> | Instance<T>
	): WorldBuilder {
		this.containerBuilder.registerSingleton(identifier, constructor);

		return this;
	}

	/**
	 * Registers an {@link  @dark-star/di!injectable} {@link System system} that can be injected in other systems or providers in the world.
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
	 * Creates a world with registered providers and {@link System systems}.
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
