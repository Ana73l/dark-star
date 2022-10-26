import { PrimitiveTypes } from '@dark-star/core';

export const core_1 = `
const PrimitiveTypes = ((PrimitiveTypes) => {
${Object.entries(PrimitiveTypes)
	.map(([name, value]) =>
		typeof name === 'string' && typeof value === 'number'
			? `PrimitiveTypes[PrimitiveTypes["${name}"] = ${value}] = "${name}";`
			: typeof name === 'number' && typeof value === 'string'
			? `PrimitiveTypes[PrimitiveTypes[${value}] = "${name}"] = ${value};`
			: ''
	)
	.filter((e) => e !== '').join(`
    `)}
})({});
const core_1 = {
    $id: Symbol('dark_star_schema_id'),
    $size: Symbol('dark_star_schema_size'),
    $definition: Symbol('dark_star_schema_definition'),
    $offset: Symbol('dark_star_offset'),
    $view: Symbol('dark_star_array_view'),
    $values: Symbol('dark_star_values'),
    $buffer: Symbol('dark_star_buffer'),
    
    PrimitiveTypes: PrimitiveTypes,
    assignViewToInstance: (instance, view, offset = 0) => {
        instance[$view] = view;
        instance[$offset] = offset;
        const schemaFields = Object.entries(instance.constructor[$definition]);
        for (const [name] of schemaFields) {
            instance[name] = instance[$values][name];
        }
        return instance;
    },
    registerSchema: (schemaCtor) => {
        schemaCtor[$id] = schemas.push(schemaCtor);

        return schemaCtor;
    }
}`;
