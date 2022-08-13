import { assert } from '@dark-star/core';
import { Schema, serializable } from '@dark-star/schema';
import { $definition, $size } from '@dark-star/schema';

/** @hidden */
export type ComponentTypeId = number;

/** Component constructor utility type */
export type ComponentType<T extends any = any> = (new () => T) & Schema;
/** Tag instance utility type */
export type Tag<T extends any = any> = {
	[P in keyof T]: T[P] extends ComponentType ? T[P] : never;
};

/**
 * @category Component
 * Decorator. Designates the target class as a component. Component constructors cannot accept arguments.
 *
 * @returns The target component constructor
 */
export const component: <T extends ComponentType>() => (target: T) => T = () => serializable();

/**
 * @category Component
 * Decorator. Designates the target class as a tag. Tag constructors cannot accept arguments and tag prototypes cannot have properties.
 *
 * @returns The target tag constructor
 */
export const tag: <T extends ComponentType<Tag>>() => (target: T) => T =
	() =>
	<T extends ComponentType<Tag>>(target: T): T => {
		assert(!target[$size] && !target[$definition], `Cannot mark not empty class as tag ${target.name}`);

		return serializable()(target);
	};
