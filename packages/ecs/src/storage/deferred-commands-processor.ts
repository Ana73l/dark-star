import { Disposable } from '@dark-star/core';

import { Entity } from '../entity';
import { ComponentType } from '../component';
import { ComponentInstancesFromTypes, ComponentTypes, OptionalComponentPartialsFromTypes } from '../query';
import { EntityStore } from './store';

export type CreateEntityCommand<T extends ComponentTypes> = {
	componentTypes?: T;
	init?: ((components: ComponentInstancesFromTypes<T>) => void) | OptionalComponentPartialsFromTypes<T>;
};

export type AttachComponentsCommand<T extends ComponentTypes> = {
	entity: Entity;
	componentTypes: T;
	init?: ((components: ComponentInstancesFromTypes<T>) => void) | OptionalComponentPartialsFromTypes<T>;
};

export type DetachComponentsCommand = {
	entity: Entity;
	componentTypes: ComponentTypes;
};

export type DestroyEntityCommand = Entity;

export class DeferredCommandsProcessor implements Disposable {
	private createEntityCommands: CreateEntityCommand<any>[] = [];
	private attachComponentsCommands: AttachComponentsCommand<any>[] = [];
	private detachComponentsCommands: DetachComponentsCommand[] = [];
	private destroyEntityCommands: DestroyEntityCommand[] = [];
	private disposed: boolean = false;

	constructor(private store: EntityStore) {}

	public get isDisposed(): boolean {
		return this.disposed;
	}

	public create<T extends ComponentTypes>(
		componentTypes?: T,
		init?: (components: ComponentInstancesFromTypes<T>) => void | OptionalComponentPartialsFromTypes<T>
	): void {
		this.createEntityCommands.push({ componentTypes, init });
	}

	public attach<T extends ComponentTypes>(
		entity: Entity,
		componentTypes?: T,
		init?: (components: ComponentInstancesFromTypes<T>) => void | OptionalComponentPartialsFromTypes<T>
	): void {
		this.attachComponentsCommands.push({ entity, componentTypes, init });
	}

	public detach(entity: Entity, componentTypes: ComponentTypes): void {
		this.detachComponentsCommands.push({ entity, componentTypes });
	}

	public destroy(entity: Entity): void {
		this.destroyEntityCommands.push(entity);
	}

	public process(): void {
		const createEntityCommands = this.createEntityCommands;
		const attachComponentsCommands = this.attachComponentsCommands;
		const detachComponentsCommands = this.detachComponentsCommands;
		const destroyEntityCommands = this.destroyEntityCommands;
		let commandIndex;

		const createCommandsCount = createEntityCommands.length;
		for (commandIndex = 0; commandIndex < createCommandsCount; commandIndex++) {
			const command = createEntityCommands[commandIndex];
			this.store.createEntity(command.componentTypes, command.init);
		}

		const attachCommandsCount = attachComponentsCommands.length;
		for (commandIndex = 0; commandIndex < attachCommandsCount; commandIndex++) {
			const command = attachComponentsCommands[commandIndex];
			this.store.attachComponents(command.entity, command.componentTypes, command.init);
		}

		const detachCommandsCount = detachComponentsCommands.length;
		for (commandIndex = 0; commandIndex < detachCommandsCount; commandIndex++) {
			const command = detachComponentsCommands[commandIndex];
			this.store.detachComponents(command.entity, command.componentTypes);
		}

		const destroyCommandsCount = destroyEntityCommands.length;
		for (commandIndex = 0; commandIndex < destroyCommandsCount; commandIndex++) {
			const entity = destroyEntityCommands[commandIndex];
			this.store.destroyEntity(entity);
		}

		this.clear();
	}

	public clear(): void {
		while (this.createEntityCommands.length > 0) {
			this.createEntityCommands.pop();
		}

		while (this.attachComponentsCommands.length > 0) {
			this.attachComponentsCommands.pop();
		}

		while (this.detachComponentsCommands.length > 0) {
			this.detachComponentsCommands.pop();
		}

		while (this.destroyEntityCommands.length > 0) {
			this.destroyEntityCommands.pop();
		}
	}

	public dispose(): void {
		this.clear();

		this.disposed = true;
	}
}
