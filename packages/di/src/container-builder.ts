import { ClassType, Instance } from '@dark-star/core';

import {
	InjectableIdentifier,
	Factory,
	InjectableData,
	Container,
} from './types';
import { DSContainer } from './container';
import { ScopeType } from './scopeType';
import { RegistrationType } from './registration-type';

import { getConstructorDependencies } from './utils/dependency';

export interface ContainerBuilder {
	registerTransient<T>(constructor: ClassType<T>): ContainerBuilder;
	registerTransient<T>(
		identifier: InjectableIdentifier<T>,
		constructor: ClassType<T> | Factory<T>
	): ContainerBuilder;

	registerSingleton<T>(constructor: ClassType<T>): ContainerBuilder;
	registerSingleton<T>(
		identifier: InjectableIdentifier<T>,
		constructor: ClassType<T> | Factory<T>
	): ContainerBuilder;
	registerSingleton<T>(
		identifier: InjectableIdentifier<T>,
		instance: Instance<T>
	): ContainerBuilder;

	build(): Container;
}

export class DSContainerBuilder implements ContainerBuilder {
	private readonly injectables: Map<
		InjectableIdentifier<unknown>,
		InjectableData<unknown>
	> = new Map();

	public registerTransient<T>(
		identifier: InjectableIdentifier<T>,
		constructor?: ClassType<T> | Factory<T>
	): DSContainerBuilder {
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

	public registerSingleton<T>(
		identifier: InjectableIdentifier<T>,
		constructor?: ClassType<T> | Factory<T> | Instance<T>
	): DSContainerBuilder {
		const scope = ScopeType.Singleton;

		if (
			constructor &&
			(constructor as any).prototype &&
			(constructor as any).prototype.constructor
		) {
			this.injectables.set(identifier, {
				scope,
				type: RegistrationType.Class,
				dependencies: getConstructorDependencies(
					constructor as ClassType<T>
				),
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

	public build(): Container {
		return new DSContainer(this.injectables);
	}
}
