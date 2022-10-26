import { Disposable } from '@dark-star/core';

import { ComponentType } from '../component';
import { Entity } from '../entity';
import { ComponentTypes, ComponentInstancesFromTypes, OptionalComponentPartialsFromTypes } from '../query';

/** @hidden Current world version. Used to track for changes. */
export type WorldUpdateVersion = number;

/** */
export abstract class World implements Disposable {
	abstract readonly version: WorldUpdateVersion;
	abstract readonly isDisposed: boolean;
	abstract readonly isStepInProgress: boolean;

	abstract spawn(): void;
	abstract spawn<T extends ComponentTypes>(componentTypes: T): void;
	abstract spawn<T extends ComponentTypes>(componentTypes: T, init: OptionalComponentPartialsFromTypes<T>): void;
	abstract spawn<T extends ComponentTypes>(componentTypes: T, init: (components: ComponentInstancesFromTypes<T>) => void): void;

	abstract exists(entity: Entity): boolean;

	abstract has<T extends ComponentType>(entity: Entity, componentType: T): boolean;

	abstract get<T extends ComponentType>(entity: Entity, componentType: T): InstanceType<T> | undefined;

	abstract attach<T extends ComponentTypes>(entity: Entity, componentTypes: T): void;
	abstract attach<T extends ComponentTypes>(entity: Entity, componentTypes: T, init: OptionalComponentPartialsFromTypes<T>): void;
	abstract attach<T extends ComponentTypes>(
		entity: Entity,
		componentTypes: T,
		init: (components: ComponentInstancesFromTypes<T>) => void
	): void;

	abstract detach<T extends ComponentTypes>(entity: Entity, componentTypes: T): void;

	abstract destroy(entity: Entity): void;

	abstract step(deltaT?: number): Promise<void>;

	abstract dispose(): Promise<void>;
}
