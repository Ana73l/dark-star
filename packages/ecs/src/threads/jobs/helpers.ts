import { $id, $view, schemas } from '@dark-star/core';
import { createSharedObjectArray } from '@dark-star/shared-object';

import { Entity } from '../../entity';
import { ComponentQueryDescriptor } from '../../query';
import { $accessFlag, $componentType, $query, ComponentLookup } from './job-transferables/component-lookup';
import { $scheduler, System } from '../../system/planning/__internals__';

import { $dependencies, JobId } from './job';
import { World } from '../../world/world';

/**
 * @internal
 * Types of non-component-query parameters passed to a {@link Job job}.
 *
 * @remarks
 * Used internally to encode and decode specific transferrable arguments in {@link Job job} between main and background threads.
 */
export enum JobParamsTypes {
	/**
	 * Component class constructor.
	 *
	 * @remarks
	 * Used to refence {@link ComponentType components constructors} in background threads, enabling execution of entity commands.
	 *
	 * @see
	 * {@link ComponentType}
	 */
	ComponentType,
	/**
	 * Key-Value pairs representing [{@link Entity}] - [{@link ComponentType component} instance].
	 *
	 * @remarks
	 * Used to enable lookup of entities (and their components) that are not part of the {@link SystemQuery} spawning the {@link Job job} in background threads.
	 *
	 * @see
	 * {@link ComponentLookup}
	 */
	ComponentLookup,
	World,
	/**
	 * Types that will not be encoded/ decoded between main and background threads.
	 *
	 * @remarks
	 * The ECS will not recognize these types as serializable between threads.
	 * JS usually uses [structured clone](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
	 * unless passing [transferable objects](https://developer.mozilla.org/en-US/docs/Glossary/Transferable_objects)
	 * or [shared array buffers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer).
	 */
	Any,
}

/**
 * @internal
 * {@link Job} non-component parameters passed to a background thread.
 *
 * @remarks
 * {@link Job} parameters need to be {@link serializeJobParams serialized} for the worker to handle special transferables like {@link ComponentLookup} where they need to be {@link deserializeJobParams deserialized}.
 *
 * @see
 * {@link serializeJobParams}\
 * {@link deserializeJobParams}
 */
export type JobParamPayload = [type: JobParamsTypes, value?: any, componentTypeId?: number][];
/**
 * @internal
 * {@link ComponentLookup} {@link serializeJobParams serialized} payload.
 *
 * @remarks
 * Used internally to recreate the {@link ComponentLookup} object on a background thread.
 *
 * @see
 * {@link ComponentLookup}
 */
export type ComponentLookupPayload = [size: number, entities: SharedArrayBuffer, components: SharedArrayBuffer][];

/**
 * @internal
 * Creates a {@link Job job} non-component parameters descriptor array.
 *
 * @remarks
 * Used internally to describe how {@link Job job} non-component parameters should be {@link deserializeJobParams deserialized} on a background thread.
 *
 * @see
 * {@link deserializeJobParams}
 */
export function serializeJobParams(): undefined;
export function serializeJobParams(params: readonly any[]): [JobParamPayload, ComponentQueryDescriptor[]];
export function serializeJobParams(params?: readonly any[]): [JobParamPayload, ComponentQueryDescriptor[]] | undefined {
	if (params) {
		const serializedParams: JobParamPayload = [];
		const componentAccessDescriptors: ComponentQueryDescriptor[] = [];
		const paramsLength = params.length;
		let currentParamIndex;

		for (currentParamIndex = 0; currentParamIndex < paramsLength; currentParamIndex++) {
			const param = params[currentParamIndex];

			if (param instanceof ComponentLookup) {
				// ComponentLookup
				// add component type access descriptor
				componentAccessDescriptors.push({
					type: param[$componentType],
					flag: param[$accessFlag],
				});

				const payload: ComponentLookupPayload = [];
				const componentTypeId = param[$componentType][$id];
				const query = param[$query];
				const archetypes = query[1];
				const archetypesLength = archetypes.length;
				let archetypeIndex;

				for (archetypeIndex = 0; archetypeIndex < archetypesLength; archetypeIndex++) {
					const chunks = archetypes[archetypeIndex].chunks;
					const chunksCount = chunks.length;
					let chunkIndex;

					for (chunkIndex = 0; chunkIndex < chunksCount; chunkIndex++) {
						const chunk = chunks[chunkIndex];
						const chunkSize = chunk.size;

						if (chunkSize > 0) {
							payload.push([
								chunkSize,
								chunk.getEntitiesArray().buffer as SharedArrayBuffer,
								chunk.getComponentArray(componentTypeId)![$view].buffer as SharedArrayBuffer,
							]);
						}
					}
				}

				serializedParams[currentParamIndex] = [JobParamsTypes.ComponentLookup, payload, componentTypeId];
			} else if (param && param[$id]) {
				// ComponentType
				serializedParams[currentParamIndex] = [JobParamsTypes.ComponentType, param[$id]];
			} else if(param.step !== undefined) {
				// World
				serializedParams[currentParamIndex] = [JobParamsTypes.World];
			} else {
				serializedParams[currentParamIndex] = [JobParamsTypes.Any, param];
			}
		}

		return [serializedParams, componentAccessDescriptors];
	} else {
		return undefined;
	}
}

/**
 * @internal
 * Deserializes {@link Job job} non-component parameters on a background thread.
 *
 * @remarks
 * ONLY to be used from background thread.
 * 
 * @see
 * {@link serializeJobParams} - serialization function on the main thread\
 * {@link mapJobParamsForMainThread} - use this on main thread to map and init job parameters
 */
export function deserializeJobParams(params: JobParamPayload): any[] {
	const paramsLength = params.length;
	const deserializedParams = new Array<any>(paramsLength);
	let currentParamIndex;

	for (currentParamIndex = 0; currentParamIndex < paramsLength; currentParamIndex++) {
		const currentParam = params[currentParamIndex];
		const type = currentParam[0];

		switch (type) {
			case JobParamsTypes.ComponentLookup:
				const componentTypeId = currentParam[2]!;
				const componentType = schemas[componentTypeId - 1];
				const componentLookup: Record<Entity, typeof componentType> = {};
				const chunks = currentParam[1] as [size: number, entities: SharedArrayBuffer, components: SharedArrayBuffer][];
				const chunksCount = chunks.length;
				let currentChunkIndex;

				for (currentChunkIndex = 0; currentChunkIndex < chunksCount; currentChunkIndex++) {
					const chunk = chunks[currentChunkIndex];
					const size = chunk[0];
					const entities = new Uint32Array(chunk[1], 0, size);
					const components = createSharedObjectArray(componentType, chunk[2], { length: size });
					let entityIndex;

					for (entityIndex = 0; entityIndex < size; entityIndex++) {
						componentLookup[entities[entityIndex]] = components[entityIndex];
					}
				}

				deserializedParams[currentParamIndex] = componentLookup;
				break;
			case JobParamsTypes.ComponentType:
				deserializedParams[currentParamIndex] = schemas[currentParam[1] - 1];
				break;
			case JobParamsTypes.World:
				/**
				 * Use global {@link WorkerWorld} instance in background thread.
				 */
				// @ts-ignore
				deserializedParams[currentParamIndex] = world;
				break;
			case JobParamsTypes.Any:
			default:
				deserializedParams[currentParamIndex] = currentParam[1];
				break;
		}
	}

	return deserializedParams;
}

/**
 * @internal
 * Prepares {@link Job job} parameters for usage on main thread in singlethreaded world or when calling {@link Job.run}.
 *
 * @remarks
 * Special parameters (e.g. {@link ComponentLookup}) need to be initialized by {@link Job jobs} to support same codebase regardless of number of threads used by the {@link World}.
 */
export function mapJobParamsForMainThread(params: readonly any[]): any[] {
	const mappedParams: any[] = [];
	const paramsLength = params.length;
	let currentParamIndex;

	for (currentParamIndex = 0; currentParamIndex < paramsLength; currentParamIndex++) {
		const param = params[currentParamIndex];

		if (param instanceof ComponentLookup) {
			const componentLookup: Record<Entity, any> = {};
			const query = param[$query];
			const componentTypeId = param[$componentType][$id];
			const archetypes = query[1];
			const archetypesLength = archetypes.length;
			let archetypeIndex;

			for (archetypeIndex = 0; archetypeIndex < archetypesLength; archetypeIndex++) {
				const chunks = archetypes[archetypeIndex].chunks;
				const chunksCount = chunks.length;
				let chunkIndex;

				for (chunkIndex = 0; chunkIndex < chunksCount; chunkIndex++) {
					const chunk = chunks[chunkIndex];
					const chunkSize = chunk.size;

					if (chunkSize > 0) {
						const entities = chunk.getEntitiesArray();
						const components = chunk.getComponentArray(componentTypeId)!;
						let entityIndex;

						for (entityIndex = 0; entityIndex < chunkSize; entityIndex++) {
							componentLookup[entities[entityIndex]] = components[entityIndex];
						}
					}
				}
			}

			mappedParams[currentParamIndex] = componentLookup;
		} else {
			mappedParams[currentParamIndex] = param;
		}
	}

	return mappedParams;
}

/**
 * @internal
 * Registers a {@link JobHandle} created by a {@link System} as a dependency to {@link System.dependency}.
 *
 * @remarks
 * {@link System Systems} need their scheduled {@link Job jobs} from previous {@link World.step step} to be completed before calling {@link System.update}.
 * This utility is used internally to add {@link Job jobs} scheduled by the system to their dependency handle for next {@link System.update}.
 *
 * @param system - {@link System} from which the {@link Job} handle has been scheduled
 * @param handleId - {@link JobHandle} unique identifier
 */
export const addHandleToSystemDependency = (system: System, handleId: JobId): void => {
	const scheduler = system[$scheduler];
	// only combine dependencies in a threaded environment
	if (scheduler) {
		if (system.dependency) {
			system.dependency[$dependencies]!.add(handleId);
		} else {
			let isComplete = false;
			let promise: Promise<void>;

			system.dependency = {
				id: 0,
				get isComplete() {
					return isComplete;
				},
				complete: async () => {
					if (isComplete) {
						return;
					}

					if (promise) {
						return promise;
					}

					promise = new Promise(async (resolve) => {
						await scheduler.completeJobs(system.dependency![$dependencies]!);

						isComplete = true;
						resolve();
					});

					return promise;
				},
				[$dependencies]: new Set([handleId]),
			};
		}
	}
};
