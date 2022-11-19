import { ComponentTypes } from '../query';
import { SystemType, SystemGroup, System } from './system';
import { Query } from './system-job-factory';

export const group =
	(grp: SystemType<SystemGroup>) =>
	<T extends SystemType>(target: T): T => {
		target.updateInGroup = grp;

		return target;
	};

export const updateBefore =
	(systemType: SystemType) =>
	<T extends SystemType>(target: T): T => {
		target.updateBefore = systemType;

		return target;
	};

export const updateAfter =
	(systemType: SystemType) =>
	<T extends SystemType>(target: T): T => {
		target.updateAfter = systemType;

		return target;
	};

export type EntitiesDecorator<T extends any> = <K extends string, V extends System & Record<K, T>>(target: V, property: K) => void;

export const entities =
	<TAll extends ComponentTypes, TSome extends ComponentTypes = [], TNone extends ComponentTypes = []>(
		...query: [all: TAll, some?: TSome, none?: TNone]
	): EntitiesDecorator<Query<TAll, TSome, TNone>> =>
	<T extends SystemType>(target: InstanceType<T>, property: string): void => {
		const systemType = target.constructor as T;
		const queryFields = (systemType.queryFields = systemType.queryFields || {});

		queryFields[property] = query;
	};
