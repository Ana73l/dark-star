import { $definition, schemas, PrimitiveTypes } from '@dark-star/core';
import { serializable } from '@dark-star/shared-object';

import { core_1 } from './core_1';
import { fieldDecorators } from './field-decorators';
import { shared_object_1 } from './shared_object_1';

const seedSerialization = (): string => `
${core_1};

const schemas = [];

const serializable = ${serializable.toString()};

const shared_object_1 = ${shared_object_1};

const fieldDecorators = {
    ${Object.entries(fieldDecorators).map(([primitiveType, decorator]) => `${Number(primitiveType)}: ${decorator.toString()}`).join(`,
    `)}
};
`;

export const createWorkerSchemaScope = (): string => `
${seedSerialization()}

${schemas
	.map((schema) => {
		const definition = schema[$definition]!;

		return `
        ${schema.toString()}

        ${Object.entries(definition).map(([fieldName, { type, args = [] }]) => {
			if (type === PrimitiveTypes.Schema) {
				return `fieldDecorators[${type}](schemas[${args[0] - 1}])(${schema.name}.prototype, "${fieldName}")`;
			} else {
				return `fieldDecorators[${type}](${args.join(',')})(${schema.name}.prototype, "${fieldName}")`;
			}
		}).join(`;
            `)}
        serializable()(${schema.name});
    `;
	})
	.join('\n')}
`;
