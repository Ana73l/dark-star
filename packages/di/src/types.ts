import { ClassType, Abstract, Instance } from '@dark-star/core';

import { ScopeType } from './scopeType';
import { RegistrationType } from './registration-type';

export type InjectableIdentifier<T> = ClassType<T> | Abstract<T>;

export interface Container {
	get<T>(identifier: InjectableIdentifier<T>): T;
}

export type Factory<T> = () => T;

export type ClassInjectableData<T> = {
	scope: ScopeType;
	class: ClassType<T>;
	dependencies: Abstract<unknown>[];
	type: RegistrationType.Class;
};

export type FactoryInjectableData<T> = {
	scope: ScopeType;
	dependencies: never[];
	type: RegistrationType.Factory;
	factory: Factory<T>;
};

export type InstanceInjectableData<T> = {
	scope: ScopeType.Singleton;
	instance: Instance<T>;
	dependencies: never[];
	type: RegistrationType.Instance;
};

export type InjectableData<T> =
	| ClassInjectableData<T>
	| FactoryInjectableData<T>
	| InstanceInjectableData<T>;

export type InjectableListMetadata = Map<
	Abstract<unknown>,
	InjectableData<unknown>
>;
