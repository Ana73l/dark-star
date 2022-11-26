import { InArray } from '@dark-star/core';

import { ComponentType, ComponentTypeId } from './component';
import { Archetype } from './storage/archetype/archetype';

export enum ComponentAccessFlags {
	Read,
	Write,
}

export interface ReadComponentAccess<T extends ComponentType = ComponentType> {
	type: T;
	flag: ComponentAccessFlags.Read;
}
export interface WriteComponentAccess<T extends ComponentType = ComponentType> {
	type: T;
	flag: ComponentAccessFlags.Write;
}

export type ComponentQueryDescriptor<T extends ComponentType = ComponentType> = ReadComponentAccess<T> | WriteComponentAccess<T>;

export type ComponentTypes = [ComponentType] | ComponentType[];

export type ComponentTypesQuery = [ComponentQueryDescriptor | ComponentType] | (ComponentQueryDescriptor | ComponentType)[];

export type ComponentInstancesFromTypes<T> = {
	[P in keyof T]: T[P] extends ComponentType<infer U> ? U : never;
};

export type OptionalComponentInstancesFromTypes<T> = {
	[P in keyof T]: T[P] extends ComponentType<infer U> ? U | undefined : never;
};

export type OptionalComponentPartialsFromTypes<T> = {
	[P in keyof T]: T[P] extends ComponentType ? InstanceType<T[P]> | undefined : never;
};

export type ComponentTypesFromQuery<T> = {
	[P in keyof T]: T[P] extends ComponentType ? T[P] : T[P] extends ComponentQueryDescriptor<infer U> ? U : never;
};

export type ComponentInstancesFromQuery<
	TDescriptors extends ComponentTypesQuery,
	TAll extends ComponentTypes,
	TSome extends ComponentTypes = [],
	TNone extends ComponentTypes = []
> = {
	[P in keyof TDescriptors]: TDescriptors[P] extends ComponentQueryDescriptor<infer U>
		? InArray<U, TNone> extends true
			? [never, 'Component type excluded from query', U]
			: InArray<U, TAll> extends true
			? TDescriptors[P] extends WriteComponentAccess
				? InstanceType<U>
				: Readonly<InstanceType<U>>
			: InArray<U, TSome> extends true
			? TDescriptors[P] extends WriteComponentAccess
				? InstanceType<U> | undefined
				: Readonly<InstanceType<U>> | undefined
			: [never, 'Component type not registered in query', U]
		: TDescriptors[P] extends ComponentType
		? InArray<TDescriptors[P], TNone> extends true
			? [never, 'Component type excluded from query', TDescriptors[P]]
			: InArray<TDescriptors[P], TAll> extends true
			? InstanceType<TDescriptors[P]>
			: InArray<TDescriptors[P], TSome> extends true
			? InstanceType<TDescriptors[P]> | undefined
			: [never, 'Component type not registered in query', TDescriptors[P]]
		: never;
};

/**
 * @internal
 * Layout of a component query. Components are represented by their unique ids assigned by the {@link component} decorator.
 */
export type QueryRecordLayout = [all: Int32Array, some: Int32Array, none?: ComponentTypeId[]];

/**
 * @internal
 * Represents a persistent {@link QueryRecordLayout components query layout} and its matching {@link Archetype archetypes}.
 */
export type QueryRecord<TAll extends ComponentTypes, TSome extends ComponentTypes = [], TNone extends ComponentTypes = []> = [
	layout: QueryRecordLayout,
	archetypes: Archetype[]
];

export const read = <T extends ComponentType>(componentType: T): ReadComponentAccess<T> => ({
	type: componentType,
	flag: ComponentAccessFlags.Read,
});

export const write = <T extends ComponentType>(componentType: T): WriteComponentAccess<T> => ({
	type: componentType,
	flag: ComponentAccessFlags.Write,
});

/**
 * @internal
 * Converts {@link ComponentTypesQuery} to {@link ComponentQueryDescriptor} array.
 * Used internally to wrap {@link ComponentTypesQuery query} array as {@link read}/ {@link write} descriptors
 * 
 * @param query - Component types to be converted
 * @returns The component types query converted as {@link read}/ {@link write} descriptors
 */
export const convertQueryToDescriptors = <T extends ComponentTypesQuery>(query: T): ComponentQueryDescriptor[] =>
	query.map((descriptor: any) =>
		typeof descriptor === 'function' ? { type: descriptor, flag: ComponentAccessFlags.Write } : descriptor
	);

/**
 * @internal
 * Converts {@link ComponentTypesQuery} to {@link ComponentTypesFromQuery} array.
 * Used internally to get the component types from a {@link ComponentType}/ {@link ComponentQueryDescriptor} array.
 * 
 * @param query - Component access descriptors to be converted
 * @returns The component types contained in the {@link ComponentTypesQuery}
 */
export const convertDescriptorsToQuery = <T extends ComponentTypesQuery>(query: T): ComponentTypesFromQuery<T> =>
	query.map((descriptor: any) => (typeof descriptor === 'function' ? descriptor : descriptor.type)) as ComponentTypesFromQuery<T>;

/**
 * @internal
 * Determines whether an {@link ComponentTypesQuery access descriptors query} contains writers.
 * 
 * @param query - Component access descriptors
 * @returns Whether list of descriptors includes a {@link write writer}
 */
export const queryHasWriter = <T extends ComponentTypesQuery>(query: T): boolean => {
	for (const descriptor of query) {
		if (typeof descriptor === 'function' || descriptor.flag === ComponentAccessFlags.Write) {
			return true;
		}
	}

	return false;
};