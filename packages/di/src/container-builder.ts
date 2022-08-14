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
	 * @param {InjectableIdentifier<T>} identifier - Class whose prototype matches T
	 * @param {ClassType<T> | Factory<T>} constructor - Class or function that creates an object matching T
	 * @returns {ContainerBuilder}
	 *
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
	 * @param {InjectableIdentifier<T>} identifier - Class whose prototype matches T
	 * @param {ClassType<T> | Factory<T> | Instance<T>} constructor - Class or function that creates an object matching T
	 * @returns {ContainerBuilder}
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
