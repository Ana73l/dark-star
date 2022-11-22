import { $id, Definition, PrimitiveTypes, schemas } from '@dark-star/core';
import { createSharedObjectArray, serializable } from '@dark-star/shared-object';

import { ComponentType, ComponentTypeId } from '../../component';
import { World } from '../../world/world';
import { ComponentInstancesFromTypes, OptionalComponentPartialsFromTypes } from '../../query';
import {
	CreateEntityCommand,
	AttachComponentsCommand,
	DetachComponentsCommand,
	DestroyEntityCommand,
} from '../../storage/deferred-commands-processor';
import { Entity } from '../../entity';

import { fieldDecorators } from './field-decorators';

export type EntityEachLambdaWorkerParams = [
	layout: Int32Array,
	chunks: [size: number, buffers: (SharedArrayBuffer | undefined)[]][],
	lambda: string,
	params?: any[]
];

export type EntityEachParallelLambdaWorkerParams = [
	layout: Int32Array,
	size: number,
	buffers: (SharedArrayBuffer | undefined)[],
	lambda: string,
	params?: any[]
];

export type EntityEachWithEntitiesLambdaWorkerParams = [
	layout: Int32Array,
	chunks: [size: number, entities: SharedArrayBuffer, buffers: (SharedArrayBuffer | undefined)[]][],
	lambda: string,
	params?: any[]
];

export type EntityEachWithEntitiesParallelLambdaWorkerParams = [
	layout: Int32Array,
	size: number,
	entities: SharedArrayBuffer,
	buffers: (SharedArrayBuffer | undefined)[],
	lambda: string,
	params?: any[]
];

export type EnqueuedWorkerWorldCommands = [
	create: [componentTypeIds?: ComponentTypeId[], componentInstances?: any[]][],
	attach: [entity: Entity, componentTypeIds: ComponentTypeId[], componentInstances?: any[]][],
	detach: [entity: Entity, componentTypeIds: ComponentTypeId[]][],
	destroy: Entity[]
];

export class WorkerWorld implements Pick<World, 'spawn' | 'attach' | 'detach' | 'destroy'> {
	private createEntityCommands: CreateEntityCommand<any>[] = [];
	private attachComponentsCommands: AttachComponentsCommand<any>[] = [];
	private detachComponentsCommands: DetachComponentsCommand[] = [];
	private destroyEntityCommands: DestroyEntityCommand[] = [];

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

	public spawn(): void;
	public spawn<T extends ComponentType<any>[]>(componentTypes?: T): void;
	public spawn<T extends ComponentType<any>[]>(
		componentTypes?: T,
		init?: (...components: ComponentInstancesFromTypes<T>) => void | OptionalComponentPartialsFromTypes<T>
	): void {
		this.createEntityCommands.push({ componentTypes, init });
	}

	public attach<T extends ComponentType<any>[]>(entity: Entity, componentTypes: T): void;
	public attach<T extends ComponentType<any>[]>(
		entity: number,
		componentTypes: T,
		init?: ((component: ComponentInstancesFromTypes<T>) => void) | OptionalComponentPartialsFromTypes<T>
	): void {
		this.attachComponentsCommands.push({ entity, componentTypes, init });
	}

	public detach<T extends ComponentType<any>[]>(entity: Entity, componentTypes: T): void {
		this.detachComponentsCommands.push({ entity, componentTypes });
	}

	public destroy(entity: Entity): void {
		this.destroyEntityCommands.push(entity);
	}

	public handleEntityEachLambda([layout, chunks, lambda, params]: EntityEachLambdaWorkerParams): EnqueuedWorkerWorldCommands {
		const parsedLambda = eval('(' + lambda + ')');

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

		return this.flush();
	}

	public handleEntityEachParallelLambda([
		layout,
		size,
		buffers,
		lambda,
		params,
	]: EntityEachParallelLambdaWorkerParams): EnqueuedWorkerWorldCommands {
		const parsedLambda = eval('(' + lambda + ')');
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

		return this.flush();
	}

	public handleEntityEachWithEntitiesLambda([layout, chunks, lambda, params]: EntityEachWithEntitiesLambdaWorkerParams) {
		const parsedLambda = eval('(' + lambda + ')');

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

		return this.flush();
	}

	public handleEntityEachWithEntitiesParallelLambda([
		layout,
		size,
		entitiesBuffer,
		buffers,
		lambda,
		params,
	]: EntityEachWithEntitiesParallelLambdaWorkerParams) {
		const parsedLambda = eval('(' + lambda + ')');
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

		return this.flush();
	}

	private buildComponentArrays(layout: Int32Array, buffers: (SharedArrayBuffer | undefined)[], length: number): any[] {
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

	private flush(): EnqueuedWorkerWorldCommands {
		const spawn: [componentTypeIds?: ComponentTypeId[], instances?: any[]][] = this.createEntityCommands.map((command) => {
			const componentTypes = command.componentTypes;
			const init = command.init;

			if (!componentTypes) {
				return [[] as ComponentTypeId[], []];
			}

			const componentTypeIds: ComponentTypeId[] = componentTypes.map((type: ComponentType) => type[$id]);

			if (!init) {
				return [componentTypeIds, []];
			}

			const initial: any[] = componentTypes.map((type: ComponentType) => new type());

			if (typeof init === 'function') {
				init(initial as any);
			} else {
				for (let i = 0; i < componentTypeIds.length; i++) {
					if (init[i]) {
						Object.assign(initial[i], init[i]);
					}
				}
			}

			return [componentTypeIds, initial];
		});

		const attach: [entity: Entity, componentTypeIds: ComponentTypeId[], instances?: any[]][] = this.attachComponentsCommands.map(
			(command) => {
				const entity = command.entity;
				const componentTypes = command.componentTypes;
				const init = command.init;

				const componentTypeIds: ComponentTypeId[] = componentTypes.map((type: ComponentType) => type[$id]);

				if (!init) {
					return [entity, componentTypeIds, []];
				}

				const initial: any[] = componentTypes.map((type: ComponentType) => new type());

				if (typeof init === 'function') {
					init(initial as any);
				} else {
					for (let i = 0; i < componentTypeIds.length; i++) {
						if (init[i]) {
							Object.assign(initial[i], init[i]);
						}
					}
				}

				return [entity, componentTypeIds, initial];
			}
		);

		const detach: [entity: Entity, componentTypeIds: ComponentTypeId[]][] = this.detachComponentsCommands.map((command) => {
			const entity = command.entity;
			const componentTypes = command.componentTypes;

			const componentTypeIds: ComponentTypeId[] = componentTypes.map((type: ComponentType) => type[$id]!);

			return [entity, componentTypeIds];
		});

		const destroy = this.destroyEntityCommands.concat([]);

		while (this.createEntityCommands.length) {
			this.createEntityCommands.pop();
		}
		while (this.attachComponentsCommands.length) {
			this.attachComponentsCommands.pop();
		}
		while (this.detachComponentsCommands.length) {
			this.detachComponentsCommands.pop();
		}
		while (this.destroyEntityCommands.length) {
			this.destroyEntityCommands.pop();
		}

		return [spawn, attach, detach, destroy];
	}
}

export class WorkerArchetypeChunk {}

export const workerWorldScript: string = `
    ${WorkerArchetypeChunk.toString()}

    ${WorkerWorld.toString()}

    const world = new WorkerWorld(true);
`;
