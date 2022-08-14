import 'reflect-metadata';
import { Abstract } from '@dark-star/core';

const PARAM_TYPES = 'design:paramtypes';

const getConstructorDependenciesFromInjectable = <T>(target: Abstract<T>, parents: string[]): Abstract<unknown>[] => {
	const dependencies: Abstract<unknown>[] = Reflect.getMetadata(PARAM_TYPES, target) || [];

	if (dependencies.length < target.length) {
		throw new Error(`Class not decorated: ${[...parents, target.name].join(' -> ')}`);
	}

	return dependencies;
};

const getBase = <T extends TBase, TBase>(target: Abstract<T>): Abstract<TBase> | undefined => {
	const base = Object.getPrototypeOf(target.prototype).constructor;

	return base === Object ? undefined : base;
};

/**
 * @hidden
 * Gets the constructor dependencies using {@link getConstructorDependenciesFromInjectable}.
 *
 * @param {Abstract<T>} target - Constructor whose dependencies will be retrieved
 * @param {string[]} parents - Parents
 *
 * @returns {Abstract<unknown>[]} - Dependencies constructors
 */
export const getConstructorDependencies = <T>(target: Abstract<T>, parents: string[] = []): Abstract<unknown>[] => {
	const dependencies = getConstructorDependenciesFromInjectable(target, parents);

	if (dependencies.length > 0) {
		return dependencies;
	}

	const base = getBase(target);

	if (base) {
		return getConstructorDependencies(base, [...parents, target.name]);
	}

	return [];
};
