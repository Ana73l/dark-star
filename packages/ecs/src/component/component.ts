import { Schema } from '@dark-star/core';
import { serializable } from '@dark-star/shared-object';

/** @internal */
export type ComponentTypeId = number;

/**
 * Component constructor utility type.
 *
 * @see
 * {@link component}
 */
export type ComponentType<T extends any = any> = (new () => T) & Schema;

/**
 * Class decorator. Marks the target class as a component.
 *
 * @remarks
 * Components are the 'C' in [ECS](https://en.wikipedia.org/wiki/Entity_component_system).\
 * They represent plain data structures and no functionality (behaviour is defined in {@link System systems}).
 *
 * Component constructors cannot accept arguments.
 *
 * @returns The target component constructor
 *
 * @example
 * ```ts
 * import { component } from '@dark-star/ecs';
 * import { float64, string16 } from '@dark-star/shared-object';
 *
 * @component()
 * class Position {
 * 	@float64()
 * 	x: number = 0;
 *
 * 	@float64()
 * 	y: number = 0;
 * }
 *
 * @component()
 * class Sprite {
 * 	@string16(30)
 * 	image!: string;
 *
 * 	@float64()
 * 	height: number = 0;
 *
 * 	@float64()
 * 	width: number = 0;
 * }
 * ```
 */
export const component: <T extends ComponentType>() => (target: T) => T = () => serializable();
