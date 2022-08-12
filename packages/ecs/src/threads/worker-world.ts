import { createSharedObjectArray } from '@dark-star/schema';
import { schemas } from '@dark-star/schema';

import { ComponentType } from '../component';
import { World } from '../world/world';
import { ComponentInstancesFromTypes, OptionalComponentPartialsFromTypes } from '../query';

import {
	CreateEntityCommand,
	AttachComponentsCommand,
	DetachComponentsCommand,
	DestroyEntityCommand,
} from '../storage/deferred-commands-processor';

export type EntityEachLambdaWorkerParams = [
	layout: Int32Array,
	chunks: [size: number, buffers: (SharedArrayBuffer | undefined)[]][],
	lambda: string
];

export type EntityEachWithEntitiesLambdaWorkerParams = [
	layout: Int32Array,
	chunks: [size: number, entities: Int32Array, buffers: (SharedArrayBuffer | undefined)[]][],
	lambda: string
];

export type EnqueuedWorkerWorldCommands = [];

export class WorkerWorld implements Pick<World, 'spawn' | 'attach' | 'detach' | 'destroy'> {
	private createEntityCommands: CreateEntityCommand<any>[] = [];
	private attachComponentsCommands: AttachComponentsCommand<any>[] = [];
	private detachComponentsCommands: DetachComponentsCommand[] = [];
	private destroyEntityCommands: DestroyEntityCommand[] = [];

	constructor(private isThreaded: boolean = true) {}

	public spawn(): void;
	public spawn<T extends ComponentType<any>[]>(componentTypes?: T): void;
	public spawn<T extends ComponentType<any>[]>(
		componentTypes?: T,
		init?: (...components: ComponentInstancesFromTypes<T>) => void | OptionalComponentPartialsFromTypes<T>
	): void {
		this.createEntityCommands.push({ componentTypes, init });
	}

	public attach<T extends ComponentType<any>[]>(entity: number, componentTypes: T): void;
	public attach<T extends ComponentType<any>[]>(
		entity: number,
		componentTypes: T,
		init?: ((component: ComponentInstancesFromTypes<T>) => void) | OptionalComponentPartialsFromTypes<T>
	): void {
		this.attachComponentsCommands.push({ entity, componentTypes, init });
	}

	public detach<T extends ComponentType<any>[]>(entity: number, componentTypes: T): void {
		this.detachComponentsCommands.push({ entity, componentTypes });
	}

	public destroy(entity: number): void {
		this.destroyEntityCommands.push(entity);
	}

	public handleEntityEachLambda([layout, chunks, lambda]: EntityEachLambdaWorkerParams): EnqueuedWorkerWorldCommands {
		const parsedLambda = eval('(' + lambda + ')');

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

				parsedLambda(...components);
			}
		}

		return this.flush();
	}

	public handleEntityEachWithEntitiesLambda([layout, chunks, lambda]: EntityEachWithEntitiesLambdaWorkerParams) {
		const parsedLambda = eval('(' + lambda + ')');

		// iterate chunks
		for (const [size, entities, buffers] of chunks) {
			const componentArrays = [];

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

				parsedLambda(entities[indexInChunk], ...components);
			}
		}

		return this.flush();
	}

	private flush(): EnqueuedWorkerWorldCommands {
		return [];
	}
}

export class WorkerArchetypeChunk {}

export const workerWorldScript: string = `
    ${WorkerArchetypeChunk.toString()}

    ${WorkerWorld.toString()}

    const world = new WorkerWorld(true);
`;
