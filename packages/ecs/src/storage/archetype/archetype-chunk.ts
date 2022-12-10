import { $id, $size } from '@dark-star/core';
import { createSharedObjectArray, SharedObjectArray } from '@dark-star/shared-object';

import { ComponentType, ComponentTypeId } from '../../component/component';
import { WorldUpdateVersion } from '../../world';
import { $entitiesArray, $componentsTable } from './__internals__';

export type EntitiesArray = Uint32Array & { size: number };
export type ComponentsArray<T extends ComponentType> = SharedObjectArray<T>;
export type ComponentArrays<T extends ComponentType[]> = {
	[P in keyof T]: T[P] extends ComponentType ? ComponentsArray<T[P]> : never;
};

export class ArchetypeChunk<T extends ComponentType[] = ComponentType[]> {
	public worldVersion: WorldUpdateVersion = 0;
	private layout: ReadonlyArray<ComponentTypeId>;

	constructor(componentTypes: ReadonlyArray<ComponentType>, public readonly capacity: number, public readonly id: number) {
		const table = [];
		const layout = [];

		for (const componentType of componentTypes) {
			const bufferSize = componentType[$size]! * capacity;

			const buffer = new SharedArrayBuffer(bufferSize);

			const sharedObjectArray = createSharedObjectArray(componentType, buffer, { length: capacity });

			table.push(sharedObjectArray);
			layout.push(componentType[$id]!);
		}

		const entitiesBuffer = new SharedArrayBuffer(capacity * Int32Array.BYTES_PER_ELEMENT);
		const entitiesArray = new Uint32Array(entitiesBuffer, 0, capacity).fill(0);

		Object.defineProperty(entitiesArray, 'size', {
			enumerable: true,
			configurable: false,
			get: () => this[$size],
		});

		this[$entitiesArray] = entitiesArray as EntitiesArray;
		this[$componentsTable] = table as ComponentArrays<T>;
		this.layout = layout;
	}

	public get size(): number {
		return this[$size];
	}

	public get full(): boolean {
		return this[$size] === this.capacity;
	}

	public getComponentArray<C extends ComponentType>(typeId: ComponentTypeId): ComponentsArray<C> | undefined;
	public getComponentArray<C extends ComponentType>(type: C): ComponentsArray<C> | undefined;
	public getComponentArray<C extends ComponentType>(type: ComponentTypeId | C): ComponentsArray<C> | undefined {
		const index = this.layout.indexOf(typeof type === 'number' ? type : type[$id]!);

		return this[$componentsTable][index] as ComponentsArray<C> | undefined;
	}

	public getEntitiesArray(): EntitiesArray {
		return this[$entitiesArray];
	}

	[$entitiesArray]: EntitiesArray;
	[$componentsTable]: ComponentArrays<T>;
	[$size]: number = 0;
}
