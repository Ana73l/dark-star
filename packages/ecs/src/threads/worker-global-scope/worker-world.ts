import { $id, Definition, PrimitiveTypes, schemas } from '@dark-star/core';
import { createSharedObjectArray, serializable } from '@dark-star/shared-object';

import { ComponentType, ComponentTypeId } from '../../component';
import { Entity } from '../../entity';

import { fieldDecorators } from './field-decorators';

export type EntityEachLambdaWorkerParams = [
	layout: Uint32Array,
	chunks: [size: number, buffers: (SharedArrayBuffer | undefined)[]][],
	lambda: string,
	params?: ReadonlyArray<any>
];

export type EntityEachParallelLambdaWorkerParams = [
	layout: Uint32Array,
	size: number,
	buffers: (SharedArrayBuffer | undefined)[],
	lambda: string,
	params?: ReadonlyArray<any>
];

export type EntityEachWithEntitiesLambdaWorkerParams = [
	layout: Uint32Array,
	chunks: [size: number, entities: SharedArrayBuffer, buffers: (SharedArrayBuffer | undefined)[]][],
	lambda: string,
	params?: ReadonlyArray<any>
];

export type EntityEachWithEntitiesParallelLambdaWorkerParams = [
	layout: Uint32Array,
	size: number,
	entities: SharedArrayBuffer,
	buffers: (SharedArrayBuffer | undefined)[],
	lambda: string,
	params?: ReadonlyArray<any>
];

export type JobWithCodeLambdaWorkerParams = [
	lambda: string,
	params?: ReadonlyArray<any>
];

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
		const parsedLambda = eval(`(${lambda})`);

		const layoutSize = layout.length;

		// proxy for components
		const components = new Array(layoutSize);

		// iterate chunks
		for (const [size, buffers] of chunks) {
			const componentArrays = [];

			let bufferIndexInLayout = 0;

			// build component arrays for chunk
			for (const buffer of buffers) {
				const componentType = schemas[layout[bufferIndexInLayout] - 1];

				componentArrays.push(buffer ? createSharedObjectArray(componentType, buffer, { length: size }) : []);

				bufferIndexInLayout++;
			}

			// call lambda on each entity of chunk
			let indexInChunk;
			let componentArrayIndex;

			for (indexInChunk = 0; indexInChunk < size; indexInChunk++) {
				// build components instances array for callback
				for (componentArrayIndex = 0; componentArrayIndex < layoutSize; componentArrayIndex++) {
					components[componentArrayIndex] = componentArrays[componentArrayIndex][indexInChunk];
				}

				parsedLambda(components, params);
			}
		}
	}

	public handleEntityEachParallelLambda([
		layout,
		size,
		buffers,
		lambda,
		params,
	]: EntityEachParallelLambdaWorkerParams) {
		const parsedLambda = eval(`(${lambda})`);
		const layoutSize = layout.length;
		const componentArrays = this.buildComponentArrays(layout, buffers, size);
		// proxy for components
		const components = new Array(layoutSize);

		// iterate entities and call lamda
		let entityIndex;
		let componentArrayIndex;

		for (entityIndex = 0; entityIndex < size; entityIndex++) {
			for (componentArrayIndex = 0; componentArrayIndex < layoutSize; componentArrayIndex++) {
				components[componentArrayIndex] = componentArrays[componentArrayIndex][entityIndex];
			}

			parsedLambda(components, params);
		}
	}

	public handleEntityEachWithEntitiesLambda([layout, chunks, lambda, params]: EntityEachWithEntitiesLambdaWorkerParams) {
		const parsedLambda = eval(`(${lambda})`);

		// iterate chunks
		for (const [size, entitiesBuffer, buffers] of chunks) {
			const componentArrays = [];
			const entities = new Uint32Array(entitiesBuffer);

			let bufferIndexInLayout = 0;

			// build component arrays for chunk
			for (const buffer of buffers) {
				const componentType = schemas[layout[bufferIndexInLayout] - 1];

				componentArrays.push(buffer ? createSharedObjectArray(componentType, buffer, { length: size }) : []);

				bufferIndexInLayout++;
			}

			const layoutSize = layout.length;

			// proxy for components
			const components = new Array(layoutSize);

			// call lambda on each entity of chunk
			let indexInChunk;
			let componentArrayIndex;

			for (indexInChunk = 0; indexInChunk < size; indexInChunk++) {
				// build components instances array for callback
				for (componentArrayIndex = 0; componentArrayIndex < layoutSize; componentArrayIndex++) {
					components[componentArrayIndex] = componentArrays[componentArrayIndex][indexInChunk];
				}

				parsedLambda(entities[indexInChunk], components, params);
			}
		}
	}

	public handleEntityEachWithEntitiesParallelLambda([
		layout,
		size,
		entitiesBuffer,
		buffers,
		lambda,
		params,
	]: EntityEachWithEntitiesParallelLambdaWorkerParams) {
		const parsedLambda = eval(`(${lambda})`);
		const layoutSize = layout.length;
		const componentArrays = this.buildComponentArrays(layout, buffers, size);
		const entities = new Uint32Array(entitiesBuffer);
		// proxy for components
		const components = new Array(layoutSize);

		// iterate entities and call lamda
		let entityIndex;
		let componentArrayIndex;

		for (entityIndex = 0; entityIndex < size; entityIndex++) {
			for (componentArrayIndex = 0; componentArrayIndex < layoutSize; componentArrayIndex++) {
				components[componentArrayIndex] = componentArrays[componentArrayIndex][entityIndex];
			}

			parsedLambda(entities[entityIndex], components, params);
		}
	}

	public handleJobWithCode([
		lambda,
		params
	]: JobWithCodeLambdaWorkerParams): any {
		const parsedCallback = eval(`(${lambda})`);

		return parsedCallback(params);
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
}
