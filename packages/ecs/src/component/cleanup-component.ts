import { serializable } from '@dark-star/shared-object';

import { ComponentType } from './component';
import { $cleanupComponent } from './__internals__';

export type CleanupComponentType<T extends any = any> = ComponentType<T> & { [$cleanupComponent]?: true };

export const cleanupComponent: <T extends CleanupComponentType>() => (target: T) => T =
	() =>
	<T extends CleanupComponentType>(target: T) => {
		target[$cleanupComponent] = true;

		return serializable()(target);
	};