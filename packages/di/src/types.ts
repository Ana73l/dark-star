import { ClassType, Abstract, Instance } from '@dark-star/core';

import { ScopeType } from './scopeType';
import { RegistrationType } from './registration-type';

/**
 * Identifier used for dependencies. Can be a concrete class on an abstract class.
 *
 * @remarks
 * Use an abstract class in cases you would provide an interface.
 * Used mostly when instances are registered as opposed to factories and constructors
 */
export type InjectableIdentifier<T> = ClassType<T> | Abstract<T>;

/**
 * Interface for a container created by a {@link ContainerBuilder}
 * Has a single property which allows instances to be constructed and retrieved
 */
export interface Container {
	/**
	 *
	 * @param {InjectableIdentifier<T>} identifier - Class or interface (abstract class) to be constructed
	 * @returns {T} - Instance of the identifier.
	 *
	 * @example
	 * ```ts
	 * @injectable()
	 * class CatService {
	 * 	// ...
	 * }
	 *
	 * const container = new ContainerBuilder()
	 * 	.registerSingleton(CatService)
	 * 	.build();
	 *
	 * const catService = container.get(CatService);
	 * ```
	 */
	get<T>(identifier: InjectableIdentifier<T>): T;
}
/**
 * Function that creates an object
 *
 * @typeParam T - type of object that the function creates
 */
export type Factory<T> = () => T;

/** @hidden */
export type ClassInjectableData<T> = {
	scope: ScopeType;
	class: ClassType<T>;
	dependencies: Abstract<unknown>[];
	type: RegistrationType.Class;
};

/** @hidden */
export type FactoryInjectableData<T> = {
	scope: ScopeType;
	dependencies: never[];
	type: RegistrationType.Factory;
	factory: Factory<T>;
};

/** @hidden */
export type InstanceInjectableData<T> = {
	scope: ScopeType.Singleton;
	instance: Instance<T>;
	dependencies: never[];
	type: RegistrationType.Instance;
};

/** @hidden */
export type InjectableData<T> = ClassInjectableData<T> | FactoryInjectableData<T> | InstanceInjectableData<T>;

/** @hidden */
export type InjectableListMetadata = Map<Abstract<unknown>, InjectableData<unknown>>;
