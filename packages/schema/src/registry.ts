import { Schema, SchemaInstance } from './schema';

/** @hidden */
export const $id = Symbol('dark_star_schema_id');
/** @hidden */
export const $size = Symbol('dark_star_schema_size');
/** @hidden */
export const $definition = Symbol('dark_star_schema_definition');
/** @hidden */
export const $offset = Symbol('dark_star_offset');
/** @hidden */
export const $view = Symbol('dark_star_array_view');
/** @hidden */
export const $values = Symbol('dark_star_values');
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
