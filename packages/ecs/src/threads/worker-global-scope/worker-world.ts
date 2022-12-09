import { Definition, PrimitiveTypes, schemas } from '@dark-star/core';
import { createSharedObjectArray, serializable } from '@dark-star/shared-object';

import { JobParamPayload, deserializeJobParams } from '../jobs/helpers';

import { fieldDecorators } from './field-decorators';

export type EntityEachLambdaWorkerParams = [
	layout: Uint32Array,
	chunks: [size: number, buffers: (SharedArrayBuffer | undefined)[]][],
	lambda: string,
	params?: JobParamPayload
];

export type EntityEachParallelLambdaWorkerParams = [
	layout: Uint32Array,
	size: number,
	buffers: (SharedArrayBuffer | undefined)[],
	lambda: string,
	params?: JobParamPayload
];

export type EntityEachWithEntitiesLambdaWorkerParams = [
	layout: Uint32Array,
	chunks: [size: number, entities: SharedArrayBuffer, buffers: (SharedArrayBuffer | undefined)[]][],
	lambda: string,
	params?: JobParamPayload
];

export type EntityEachWithEntitiesParallelLambdaWorkerParams = [
	layout: Uint32Array,
	size: number,
	entities: SharedArrayBuffer,
	buffers: (SharedArrayBuffer | undefined)[],
	lambda: string,
	params?: JobParamPayload
];

export type JobWithCodeLambdaWorkerParams = [lambda: string, params?: JobParamPayload];

export class WorkerWorld {
	public registerSchemas(schemaTypes: [string, Definition | undefined][]): void {
		for (const [schemaName, definition] of schemaTypes) {
			const schemaClass = class {};

			Object.entries(definition || []).forEach(([fieldName, { type, args = [] }]) => {
				const decorator = fieldDecorators[type];

				if (type === PrimitiveTypes.Schema) {
					decorator(schemas[args[0] - 1])(schemaClass.prototype, fieldName);
				} else {
					decorator(...args)(schemaClass.prototype, fieldName);
				}
			});

			serializable()(schemaClass);

			// @ts-ignore
			self[schemaName] = schemaClass;
		}
	}

	public handleEntityEachLambda([layout, chunks, lambda, params]: EntityEachLambdaWorkerParams) {
		const parsedParams = this.buildJobParams(params);
		const parsedLambda = eval(`(${lambda})`);

		const layoutSize = layout.length;
		// proxy for components
		const components = new Array(layoutSize);

		// iterate chunks
		for (const [size, buffers] of chunks) {
			const componentArrays = this.buildComponentArrays(layout, buffers, size);

			// call lambda on each entity of chunk
			let indexInChunk;
			let componentArrayIndex;

			for (indexInChunk = 0; indexInChunk < size; indexInChunk++) {
				// build components instances array for callback
				for (componentArrayIndex = 0; componentArrayIndex < layoutSize; componentArrayIndex++) {
					components[componentArrayIndex] = componentArrays[componentArrayIndex][indexInChunk];
				}

				parsedLambda(components, parsedParams);
			}
		}
	}

	public handleEntityEachWithEntitiesLambda([layout, chunks, lambda, params]: EntityEachWithEntitiesLambdaWorkerParams) {
		const parsedParams = this.buildJobParams(params);
		const parsedLambda = eval(`(${lambda})`);

		const layoutSize = layout.length;
		// proxy for components
		const components = new Array(layoutSize);

		// iterate chunks
		for (const [size, entitiesBuffer, buffers] of chunks) {
			const componentArrays = this.buildComponentArrays(layout, buffers, size);
			const entities = new Uint32Array(entitiesBuffer);

			// call lambda on each entity of chunk
			let indexInChunk;
			let componentArrayIndex;

			for (indexInChunk = 0; indexInChunk < size; indexInChunk++) {
				// build components instances array for callback
				for (componentArrayIndex = 0; componentArrayIndex < layoutSize; componentArrayIndex++) {
					components[componentArrayIndex] = componentArrays[componentArrayIndex][indexInChunk];
				}

				parsedLambda(entities[indexInChunk], components, parsedParams);
			}
		}
	}

	public handleJobWithCode([lambda, params]: JobWithCodeLambdaWorkerParams): any {
		const parsedParams = this.buildJobParams(params);
		const parsedCallback = eval(`(${lambda})`);

		return parsedCallback(parsedParams);
	}

	private buildComponentArrays(layout: Uint32Array, buffers: (SharedArrayBuffer | undefined)[], length: number): any[] {
		const componentArrays = [];
		const layoutSize = layout.length;
		let bufferIndex;

		for (bufferIndex = 0; bufferIndex < layoutSize; bufferIndex++) {
			const buffer = buffers[bufferIndex];
			const componentType = schemas[layout[bufferIndex] - 1];

			componentArrays.push(buffer ? createSharedObjectArray(componentType, buffer, { length }) : []);
		}

		return componentArrays;
	}

	private buildJobParams(params?: JobParamPayload): any[] | undefined {
		return params ? deserializeJobParams(params) : undefined;
	}
}
