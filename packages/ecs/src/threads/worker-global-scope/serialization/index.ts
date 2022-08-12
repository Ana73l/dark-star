import { PrimitiveTypes, serializable } from '@dark-star/schema';
import { $definition, schemas } from '@dark-star/schema';

import { registry_1 } from './registry_1';
import { fieldDecorators } from './field-decorators';
import { serialization_1 } from './serialization_1';

const seedSerialization = (): string => `
const registry_1 = ${registry_1};

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

const schema_1 = { PrimitiveTypes };

const schemas = [];

const serializable = ${serializable.toString()};

const fieldDecorators = {
    ${Object.entries(fieldDecorators).map(
		([primitiveType, decorator]) => `${Number(primitiveType)}: ${decorator.toString()}`
	).join(`,
    `)}
};

const serialization_1 = ${serialization_1};
`;

export const createWorkerSchemaScope = (): string => `
${seedSerialization()}

${schemas.map((schema) => {
	const definition = schema[$definition]!;

	return `
        ${schema.toString()}

        ${Object.entries(definition).map(([fieldName, { type, args = [] }]) => {
			if (type === PrimitiveTypes.Schema) {
				return `fieldDecorators[${type}](schemas[${args[0] - 1}])(${schema.name}.prototype, ${fieldName})`;
			} else {
				return `fieldDecorators[${type}](...${args})(${schema.name}.prototype, ${fieldName})`;
			}
		}).join(`;
            `)}
        serializable(${schema.name});
    `;
})}
`;
