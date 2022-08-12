import { Schema, SchemaInstance } from './schema';

export const $id = Symbol('dark_star_schema_id');
export const $size = Symbol('dark_star_schema_size');
export const $definition = Symbol('dark_star_schema_definition');

export const $offset = Symbol('dark_star_offset');
export const $view = Symbol('dark_star_array_view');
export const $values = Symbol('dark_star_values');

export const schemas: (Schema & (new () => any))[] = [];

export function registerSchema<T extends Schema & (new () => any)>(schemaCtor: T): T {
    schemaCtor[$id] = schemas.push(schemaCtor);

    return schemaCtor;
}

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
