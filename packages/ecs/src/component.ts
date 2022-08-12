import { assert } from '@dark-star/core';
import { Schema, serializable } from '@dark-star/schema';
import { $definition, $size } from '@dark-star/schema';

export type ComponentTypeId = number;
export type ComponentType<T extends any = any> = (new () => T) & Schema;
export type Tag<T extends any = any> = {
	[P in keyof T]: T[P] extends ComponentType ? T[P] : never;
};

export const component: <T extends ComponentType>() => (target: T) => T = () => serializable();

export const tag: <T extends ComponentType<Tag>>() => (target: T) => T =
	() =>
	<T extends ComponentType<Tag>>(target: T): T => {
		assert(!target[$size] && !target[$definition], `Cannot mark not empty class as tag ${target.name}`);

		return serializable()(target);
	};
