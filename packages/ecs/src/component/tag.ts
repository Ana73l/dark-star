import { $definition, $size, assert } from '@dark-star/core';
import { serializable } from '@dark-star/shared-object';

import { ComponentType } from './component';

/**
 * Tag instance utility type.
 *
 * @see
 * {@link tag}
 */
export type Tag<T extends any = any> = {
	[P in keyof T]: T[P] extends ComponentType ? T[P] : never;
};

/**
 * Class decorator. Marks the target class as a tag.
 *
 * @remarks
 * Tags are a special kind of {@link component components} that have no properties and are used as flags. Unlike {@link component components}, tag instances are not stored in archetype chunks.
 *
 * Tag constructors cannot accept arguments and their prototypes cannot have properties.
 *
 * @returns The target tag constructor
 *
 * ```ts
 * import { tag } from '@dark-star/ecs';
 *
 * @tag()
 * class Active {}
 * ```
 */
export const tag: <T extends ComponentType<Tag>>() => (target: T) => T =
	() =>
	<T extends ComponentType<Tag>>(target: T): T => {
		assert(!target[$size] && !target[$definition], `Cannot mark not empty class as tag ${target.name}`);

		return serializable()(target);
	};
