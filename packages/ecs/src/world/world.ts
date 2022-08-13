import { Disposable } from '@dark-star/core';

import { ComponentType } from '../component';
import { Entity } from '../entity';
import { ComponentInstancesFromTypes, OptionalComponentPartialsFromTypes } from '../query';

export type WorldUpdateVersion = number;

export abstract class World implements Disposable {
	abstract readonly version: WorldUpdateVersion;
	abstract readonly isDisposed: boolean;
	abstract readonly isStepInProgress: boolean;

	abstract spawn(): void;
	abstract spawn<T extends ComponentType[]>(componentTypes: T): void;
	abstract spawn<T extends ComponentType[]>(componentTypes: T, init: OptionalComponentPartialsFromTypes<T>): void;
	abstract spawn<T extends ComponentType[]>(
		componentTypes: T,
		init: (...components: ComponentInstancesFromTypes<T>) => void
	): void;

	abstract exists(entity: Entity): boolean;

	abstract has<T extends ComponentType>(entity: Entity, componentType: T): boolean;

	abstract get<T extends ComponentType>(entity: Entity, componentType: T): InstanceType<T> | undefined;

	abstract attach<T extends ComponentType[]>(entity: Entity, componentTypes: T): void;
	abstract attach<T extends ComponentType[]>(
		entity: Entity,
		componentTypes: T,
		init: OptionalComponentPartialsFromTypes<T>
	): void;
	abstract attach<T extends ComponentType[]>(
		entity: Entity,
		componentTypes: T,
		init: (component: ComponentInstancesFromTypes<T>) => void
	): void;

	abstract detach<T extends ComponentType[]>(entity: Entity, componentTypes: T): void;

	abstract destroy(entity: Entity): void;

	abstract step(deltaT?: number): Promise<void>;

	abstract dispose(): Promise<void>;
}
