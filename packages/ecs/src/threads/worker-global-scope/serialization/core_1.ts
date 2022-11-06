import { PrimitiveTypes } from '@dark-star/core';

export const core_1 = `
let PrimitiveTypes;
((PrimitiveTypes) => {
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
})(PrimitiveTypes = {});
const _dark_star_core__WEBPACK_IMPORTED_MODULE_16__ = {
    $id: Symbol('dark_star_schema_id'),
    $size: Symbol('dark_star_schema_size'),
    $definition: Symbol('dark_star_schema_definition'),
    $offset: Symbol('dark_star_offset'),
    $view: Symbol('dark_star_array_view'),
    $values: Symbol('dark_star_values'),
    $buffer: Symbol('dark_star_buffer'),
    
    PrimitiveTypes: PrimitiveTypes,
    assignViewToInstance: (instance, view, offset = 0) => {
        instance[_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$view] = view;
        instance[_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$offset] = offset;
        const schemaFields = Object.entries(instance.constructor[_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$definition]);

        if(instance[_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$values]) {
            for (const [name] of schemaFields) {
                if(instance[_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$values[name]]) {
                    instance[name] = instance[_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$values][name];
                }
            }
        }
        
        return instance;
    },
    registerSchema: (schemaCtor) => {
        schemaCtor[_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$id] = _dark_star_core__WEBPACK_IMPORTED_MODULE_4__.schemas.push(schemaCtor);

        return schemaCtor;
    }
}`;
