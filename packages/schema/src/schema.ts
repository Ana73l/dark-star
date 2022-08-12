import { Instance } from '@dark-star/core';

import { $definition, $id, $offset, $size, $values, $view } from './registry';

export enum PrimitiveTypes {
	Int8,
	Uint8,
	Int16,
	Uint16,
	Int32,
	Uint32,
	Float32,
	Float64,
	BigInt64,
	BigUint64,
	Boolean,
	String8,
	String16,
	Schema,
}

export type DefinitionField = {
	type: PrimitiveTypes;
	args?: any[];
};

export type Definition = { [key: string]: DefinitionField };

export type SchemaId = number;

export type Schema = {
	[$id]?: number;
	[$size]?: number;
	[$definition]?: Definition;
};

export type SchemaInstance<T extends any> = Instance<T> & {
	constructor: Schema;
	[$offset]?: number;
	[$view]?: DataView;
	[$values]?: Partial<SchemaInstance<T>>;
};
