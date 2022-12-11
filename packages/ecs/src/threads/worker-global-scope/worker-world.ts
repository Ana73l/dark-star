import { $id, $size, $view, Definition, PrimitiveTypes, schemas } from '@dark-star/core';
import { createSharedObject, createSharedObjectArray, serializable } from '@dark-star/shared-object';

import { Entity } from '../../entity';
import { ComponentTypes, ComponentInstancesFromTypes } from '../../query';
import { World } from '../../world';

import { JobParamPayload, deserializeJobParams, WorkerWorldLambdaResponse } from '../jobs/helpers';

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

export class WorkerWorld implements Pick<World, 'spawn' | 'attach' | 'detach' | 'destroy'> {
	private spawnCommands: [SharedArrayBuffer | undefined, (SharedArrayBuffer | undefined)[] | undefined][] = [];
	private attachCommands: [SharedArrayBuffer, (SharedArrayBuffer | undefined)[] | undefined][] = [];
	private detachCommands: SharedArrayBuffer[] = [];
	private destroyCommands: Entity[] = [];

	spawn(): void;
	spawn<T extends ComponentTypes>(componentTypes: T): void;
	spawn<T extends ComponentTypes>(componentTypes: T, init: (entity: Entity, components: ComponentInstancesFromTypes<T>) => void): void;
	spawn<T extends ComponentTypes>(componentTypes?: T, init?: (entity: Entity, components: ComponentInstancesFromTypes<T>) => void): void {
		const result = new Array(2) as [SharedArrayBuffer | undefined, (SharedArrayBuffer | undefined)[] | undefined];

		if (componentTypes) {
			const componentTypesCount = componentTypes.length;
			const componentTypeIdsBuffer = new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * componentTypesCount);
			const componentTypeIdsView = new Uint32Array(componentTypeIdsBuffer);
			const spawnComponentInstances = init ? new Array(componentTypesCount) : undefined;
			let componentTypeIndex;

			for (componentTypeIndex = 0; componentTypeIndex < componentTypesCount; componentTypeIndex++) {
				const componentType = componentTypes[componentTypeIndex];

				componentTypeIdsView[componentTypeIndex] = componentType[$id]!;

				if (init) {
					spawnComponentInstances![componentTypeIndex] = componentType[$size] ? createSharedObject(componentType) : undefined;
				}
			}

			result[0] = componentTypeIdsBuffer;

			if (init) {
				init(-1, spawnComponentInstances as ComponentInstancesFromTypes<T>);

				const componentBuffers: (SharedArrayBuffer | undefined)[] = new Array(componentTypesCount);

				for (componentTypeIndex = 0; componentTypeIndex < componentTypesCount; componentTypeIndex++) {
					componentBuffers[componentTypeIndex] = spawnComponentInstances![componentTypeIndex]?.[$view]?.buffer;
				}

				result[1] = componentBuffers;
			}
		}

		this.spawnCommands.push(result);
	}

	attach<T extends ComponentTypes>(entity: Entity, componentTypes: T): void;
	attach<T extends ComponentTypes>(entity: Entity, componentTypes: T, init: (components: ComponentInstancesFromTypes<T>) => void): void;
	attach<T extends ComponentTypes>(entity: Entity, componentTypes: T, init?: (components: ComponentInstancesFromTypes<T>) => void): void {
		const result = new Array(2) as [SharedArrayBuffer, (SharedArrayBuffer | undefined)[] | undefined];

		const componentTypesCount = componentTypes.length;
		const componentTypeIdsBuffer = new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * (componentTypesCount + 1));
		const componentTypeIdsView = new Uint32Array(componentTypeIdsBuffer);
		const attachComponentInstances = init ? new Array(componentTypesCount) : undefined;
		let componentTypeIndex;

		for (componentTypeIndex = 0; componentTypeIndex < componentTypesCount; componentTypeIndex++) {
			const componentType = componentTypes[componentTypeIndex];

			componentTypeIdsView[componentTypeIndex + 1] = componentType[$id]!;

			if (init) {
				attachComponentInstances![componentTypeIndex] = componentType[$size] ? createSharedObject(componentType) : undefined;
			}

			result[0] = componentTypeIdsBuffer;

			if (init) {
				init(attachComponentInstances as ComponentInstancesFromTypes<T>);

				const componentBuffers: (SharedArrayBuffer | undefined)[] = new Array(componentTypesCount);

				for (componentTypeIndex = 0; componentTypeIndex < componentTypesCount; componentTypeIndex++) {
					componentBuffers[componentTypeIndex] = attachComponentInstances![componentTypeIndex]?.[$view]?.buffer;
				}

				result[1] = componentBuffers;
			}
		}

		this.attachCommands.push(result);
	}

	detach<T extends ComponentTypes>(entity: Entity, componentTypes: T): void {
		const componentTypesCount = componentTypes.length;
		const detachCommandBuffer = new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * (componentTypesCount + 1));
		const detachCommandView = new Uint32Array(detachCommandBuffer);
		let componentTypeIndex;

		detachCommandView[0] = entity;

		for (componentTypeIndex = 0; componentTypeIndex < componentTypesCount; componentTypeIndex++) {
			const componentTypeId = componentTypes[componentTypeIndex][$id]!;

			detachCommandView[componentTypeIndex + 1] = componentTypeId;
		}

		this.detachCommands.push(detachCommandBuffer);
	}

	destroy(entity: Entity): void {
		this.destroyCommands.push(entity);
	}

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

	public handleEntityEachLambda([layout, chunks, lambda, params]: EntityEachLambdaWorkerParams): WorkerWorldLambdaResponse {
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

		return this.flushEnqueuedCommands();
	}

	public handleEntityEachWithEntitiesLambda([
		layout,
		chunks,
		lambda,
		params,
	]: EntityEachWithEntitiesLambdaWorkerParams): WorkerWorldLambdaResponse {
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

		return this.flushEnqueuedCommands();
	}

	public handleJobWithCode([lambda, params]: JobWithCodeLambdaWorkerParams): WorkerWorldLambdaResponse {
		const parsedParams = this.buildJobParams(params);
		const parsedCallback = eval(`(${lambda})`);

		parsedCallback(parsedParams);

		return this.flushEnqueuedCommands();
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

	private flushEnqueuedCommands(): WorkerWorldLambdaResponse {
		let currentCommandIndex;

		// spawn commands
		const spawnCommands = this.spawnCommands;
		const spawnCommandsCount = spawnCommands.length;
		const spawnCommandsBuffersArray: [SharedArrayBuffer | undefined, (SharedArrayBuffer | undefined)[] | undefined][] = new Array(
			spawnCommandsCount
		);
		currentCommandIndex = spawnCommandsCount;
		while (spawnCommands.length) {
			currentCommandIndex--;
			spawnCommandsBuffersArray[currentCommandIndex] = spawnCommands.pop()!;
		}

		// attach commands
		const attachCommands = this.attachCommands;
		const attachCommandsCount = attachCommands.length;
		const attachCommandsBuffersArray: [SharedArrayBuffer, (SharedArrayBuffer | undefined)[] | undefined][] = new Array(
			attachCommandsCount
		);
		currentCommandIndex = attachCommandsCount;
		while (attachCommands.length) {
			currentCommandIndex--;
			attachCommandsBuffersArray[currentCommandIndex] = attachCommands.pop()!;
		}

		// detach commands
		const detachCommands = this.detachCommands;
		const detachCommandsCount = detachCommands.length;
		const detachCommandsBuffersArray: SharedArrayBuffer[] = new Array(detachCommandsCount);
		currentCommandIndex = detachCommandsCount;
		while (detachCommands.length) {
			currentCommandIndex--;
			detachCommandsBuffersArray[currentCommandIndex] = detachCommands.pop()!;
		}

		// destroy commands
		const destroyCommands = this.destroyCommands;
		const destroyCommandsCount = destroyCommands.length;
		const destroyCommandsBuffer = new SharedArrayBuffer(destroyCommandsCount * Uint32Array.BYTES_PER_ELEMENT);
		const destroyCommandsView = new Uint32Array(destroyCommandsBuffer);
		currentCommandIndex = destroyCommandsCount;
		while (destroyCommands.length) {
			currentCommandIndex--;
			destroyCommandsView[currentCommandIndex] = destroyCommands.pop()!;
		}

		return [spawnCommandsBuffersArray, attachCommandsBuffersArray, detachCommandsBuffersArray, destroyCommandsBuffer];
	}
}
