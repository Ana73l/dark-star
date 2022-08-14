import { ClassType, Instance } from '@dark-star/core';

import { InjectableIdentifier, Factory, InjectableData, Container } from './types';
import { DSContainer } from './ds-container';
import { ScopeType } from './scopeType';
import { RegistrationType } from './registration-type';

import { getConstructorDependencies } from './utils/dependency';

/**
 * Class that builds a {@link Container}.
 * Provides methods for registering injectable classes, factories and instances to the container.
 */
export class ContainerBuilder {
	private readonly injectables: Map<InjectableIdentifier<unknown>, InjectableData<unknown>> = new Map();

	/**
	 * Registers a transient provider in the container.
	 * The container will inject a new instance of the provider in each dependee.
	 *
	 * @typeParam T - Type of the object created by the factory/ constructor
	 * @param {InjectableIdentifier} identifier - Class whose prototype matches T
	 * @param {ClassType | Factory} constructor - Class or function that creates an object matching T
	 * @returns {ContainerBuilder}
	 *
	 * ```ts
	 * // using 'interface' and factory
	 * abstract class ILogger {
	 * 	abstract log(...args: string[]): void;
	 * }
	 *
	 * const createLogger = (): ILogger => {
	 * 	log: (...args: string[]) => {
	 * 		// ...
	 * 	}
	 * }
	 *
	 * // using class
	 * @injectable()
	 * class MyTransientService {
	 * 	constructor(private logger: ILogger) {}
	 * }
	 *
	 * // using 'interface' and class
	 * abstract class ITaskQueue<T> {
	 * 	abstract push(item: T): TaskQueue<T>;
	 * 	// ...
	 * }
	 *
	 * @injectable()
	 * class TaskQueue<T> implements ITaskQueue<T> {
	 * 	constructor(private service: MyTransientService, private logger: ILogger) {}
	 * 	push(item: T) {
	 * 		// ...
	 * 	}
	 * 	// ...
	 * }
	 *
	 * const container = new ContainerBuilder()
	 * 	.registerTransient(ILogger, createLogger)
	 * 	.registerTransient(MyTransientService)
	 * 	.registerTransient(ITaskQueue, TaskQueue);
	 * ```
	 * @remarks
	 * Instances cannot be passed to registerTransient since they are singletons in the container.
	 * To pass instances use {@link ContainerBuilder.registerSingleton}.
	 */
	public registerTransient<T>(
		identifier: InjectableIdentifier<T>,
		constructor?: ClassType<T> | Factory<T>
	): ContainerBuilder {
		const scope = ScopeType.Transient;

		if (constructor?.prototype?.constructor) {
			this.injectables.set(identifier, {
				scope,
				type: RegistrationType.Class,
				dependencies: getConstructorDependencies(constructor),
				class: constructor as ClassType<T>,
			});
		} else if (typeof constructor === 'function') {
			this.injectables.set(identifier, {
				scope,
				type: RegistrationType.Factory,
				dependencies: [] as never[],
				factory: constructor as Factory<T>,
			});
		} else {
			this.injectables.set(identifier, {
				scope,
				type: RegistrationType.Class,
				dependencies: getConstructorDependencies(identifier),
				class: identifier as ClassType<T>,
			});
		}

		return this;
	}

	/**
	 * Registers a singleton provider in the container.
	 * The container will hold and inject a single instance of the provider in each dependee.
	 *
	 * @typeParam T - Type of the object created by the factory/ constructor
	 * @param {InjectableIdentifier} identifier - Class whose prototype matches T
	 * @param {ClassType | Factory | Instance} constructor - Class or function that creates an object matching T
	 * @returns {ContainerBuilder}
	 *
	 * ```ts
	 * // using 'interface' and instance
	 * abstract class IModels {
	 * 	abstract getModel(name: string): Model;
	 * }
	 *
	 * const models: IModels = {
	 * 	getModel: (name: string) => {
	 * 		// ...
	 * 	}
	 * }
	 *
	 * // using class
	 * @injectable()
	 * class World {
	 * 	constructor(private models: IModels) {}
	 * }
	 *
	 * const container = new ContainerBuilder()
	 * 	.registerSingleton(IModels, models)
	 * 	.registerSingleton(World);
	 * ```
	 */
	public registerSingleton<T>(
		identifier: InjectableIdentifier<T>,
		constructor?: ClassType<T> | Factory<T> | Instance<T>
	): ContainerBuilder {
		const scope = ScopeType.Singleton;

		if (constructor && (constructor as any).prototype && (constructor as any).prototype.constructor) {
			this.injectables.set(identifier, {
				scope,
				type: RegistrationType.Class,
				dependencies: getConstructorDependencies(constructor as ClassType<T>),
				class: constructor as ClassType<T>,
			});
		} else if (typeof constructor === 'function') {
			this.injectables.set(identifier, {
				scope,
				type: RegistrationType.Factory,
				dependencies: [] as never[],
				factory: constructor as Factory<T>,
			});
		} else if (constructor !== undefined) {
			this.injectables.set(identifier, {
				scope,
				type: RegistrationType.Instance,
				dependencies: [] as never[],
				instance: constructor,
			});
		} else {
			this.injectables.set(identifier, {
				scope,
				type: RegistrationType.Class,
				dependencies: getConstructorDependencies(identifier),
				class: identifier as ClassType<T>,
			});
		}

		return this;
	}

	/**
	 * Creates a container from which instances of the providers can be retrieved
	 *
	 * @returns {Container}
	 */
	public build(): Container {
		return new DSContainer(this.injectables);
	}
}
