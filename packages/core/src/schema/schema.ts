import { Instance } from '../types';
import { $definition, $id, $offset, $size, $values, $view } from './symbols';

/**
 * @hidden
 * @enum
 * Field types that can be encoded to a DataView
 */
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

/** @hidden */
export type DefinitionField = {
	type: PrimitiveTypes;
	args?: any[];
};

/** @hidden */
export type Definition = { [key: string]: DefinitionField };

/** @hidden */
export type SchemaId = number;

/** @hidden */
export type Schema = {
	[$id]?: number;
	[$size]?: number;
	[$definition]?: Definition;
};

/** @hidden */
export type SchemaInstance<T extends any> = Instance<T> & {
	constructor: Schema;
	[$offset]?: number;
	[$view]?: DataView;
	[$values]?: Partial<SchemaInstance<T>>;
};

/** @hidden */
export const schemas: (Schema & (new () => any))[] = [];

/**
 * @hidden
 *
 * Registers a Schema constructor in the internal list of schemas
 *
 * @typeParam T - Schema constructor type
 * @param {T} schemaCtor - Schema constructor
 * @returns {T}
 * */
export function registerSchema<T extends Schema & (new () => any)>(schemaCtor: T): T {
	schemaCtor[$id] = schemas.push(schemaCtor);

	return schemaCtor;
}
/**
 * @hidden
 *
 * Assigns a DataView to a Schema instance and writes the cached values
 *
 * @param {SchemaInstance} instance - The schema instance
 * @param {DataView} view - The DataView to be written on
 * @param {number} [offset=0] - Starting offset in the DataView for the instance
 * @returns {SchemaInstance}
 * */
export function assignViewToInstance(
	instance: SchemaInstance<any>,
	view: DataView,
	offset: number = 0
): SchemaInstance<any> {
	instance[$view] = view;
	instance[$offset] = offset;

	const schemaFields = Object.entries(instance.constructor[$definition]);

	for (const [name] of schemaFields) {
		instance[name] = instance[$values][name];
	}

	return instance;
}
