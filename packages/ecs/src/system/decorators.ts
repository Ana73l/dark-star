import { ComponentTypes } from '../query';

import { SystemType, SystemGroup, System } from './system';
import { SystemQuery } from './system-query';

/**
 * Class decorator factory. Specifies the {@link SystemGroup} which the decorated {@link System} should be added to.
 * 
 * @remarks
 * Adding a {@link System system} to a group means that the target system can be ordered relative to other systems in the same group using {@link updateBefore} and {@link updateAfter}.
 * 
 * @see
 * {@link SystemGroup}\
 * {@link updateBefore}\
 * {@link updateAfter}\
 * {@link SystemType}
 * 
 * @param grp - {@link SystemGroup} to be added to
 * @returns Class decorator
 * 
 * @example
 * ```ts
 * @injectable()
 * class PhysicsGroup extends SystemGroup {}
 * 
 * @injectable()
 * @group(PhysicsGroup)
 * class CalculateAcceleration extends System {
 * 	// ...
 * }
 * ```
 */
export const group =
	(grp: SystemType<SystemGroup>) =>
	<T extends SystemType>(target: T): T => {
		target.updateInGroup = grp;

		return target;
	};

/**
 * Class decorator factory. Specifies the {@link System} belonging to the same {@link SystemGroup} before which the decorated {@link System} will be executed.
 * 
 * @see
 * {@link SystemGroup}\
 * {@link updateAfter}\
 * {@link SystemType}
 * 
 * @param systemType - {@link System} before which decorated {@link System system} will be updated
 * @returns Class decorator
 * 
 * @example
 * ```ts
 * @injectable()
 * class InputGroup extends SystemGroup {}
 * 
 * @injectable()
 * @group(InputGroup)
 * class ApplyInput extends System {
 * 	// ...
 * }
 * 
 * @injectable()
 * @group(InputGroup)
 * @updateBefore(ApplyInput)
 * class ReadInput extends System {
 * 	// ...
 * }
 * ```
 */
export const updateBefore =
	(systemType: SystemType) =>
	<T extends SystemType>(target: T): T => {
		target.updateBefore = systemType;

		return target;
	};

/**
 * Class decorator factory. Specifies the {@link System} belonging to the same {@link SystemGroup} after which the decorated {@link System} will be executed.
 * 
 * @see
 * {@link SystemGroup}\
 * {@link updateBefore}\
 * {@link SystemType}
 * 
 * @param systemType - {@link System} after which decorated {@link System system} will be updated
 * @returns Class decorator
 * 
 * @example
 * ```ts
 * @injectable()
 * class RenderGroup extends SystemGroup {}
 * 
 * @injectable()
 * @group(RenderGroup)
 * class ClearRenderingContext extends System {
 * 	// ...
 * }
 * 
 * @injectable()
 * @group(RenderGroup)
 * @updateAfter(ClearRenderingContext)
 * class RenderSprites extends System {
 * 	// ...
 * }
 * ```
 */
export const updateAfter =
	(systemType: SystemType) =>
	<T extends SystemType>(target: T): T => {
		target.updateAfter = systemType;

		return target;
	};

/**
 * Utility type enforcing decorated property to be of type {@link SystemQuery}.
 * 
 * @see
 * {@link entities}
 */
export type EntitiesDecorator<T> = <K extends string, V extends System & Record<K, T>>(target: V, property: K) => void;

/**
 * Class property decorator factory. Marks a {@link System system} field to be injected with a {@link SystemQuery}.
 * 
 * @remarks
 * The query is automatically updated. Queries are used to retrieve entities with given sets of components and provide mechanisms for scheduling {@link Job jobs}.
 * @see
 * {@link SystemQuery}\
 * {@link System.query}
 * 
 * @param all - Include archetypes that have every component in this list
 * @param some - Include archetypes that have any component in this list (or none)
 * @param none - Exclude archetypes that have any component in this list
 * @returns Class property decorator
 * 
 * @example
 * ```ts
 * @injectable()
 * class TickLifeTime extends System {
 * 	@entities([LifeTime])
 * 	public timedEntities!: SystemQuery<[typeof LifeTime]>;
 * 
 * 	// ...
 * }
 * ```
 */
export const entities =
	<TAll extends ComponentTypes, TSome extends ComponentTypes = [], TNone extends ComponentTypes = []>(
		all: TAll, some?: TSome, none?: TNone
	): EntitiesDecorator<SystemQuery<TAll, TSome, TNone>> =>
	<T extends SystemType>(target: InstanceType<T>, property: string): void => {
		const systemType = target.constructor as T;
		const queryFields = (systemType.queries = systemType.queries || {});

		queryFields[property] = [all, some, none];
	};
