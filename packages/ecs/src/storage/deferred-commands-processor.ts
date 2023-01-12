import { Disposable } from '@dark-star/core';

import { Entity } from '../entity';
import { ComponentInstancesFromTypes, ComponentTypes } from '../query';
import { EntityStore } from './store';

export type CreateEntityCommand<T extends ComponentTypes> = {
	componentTypes?: T;
	init?: (entity: Entity, components: ComponentInstancesFromTypes<T>) => void;
};

export type AttachComponentsCommand<T extends ComponentTypes> = {
	entity: Entity;
	componentTypes: T;
	init?: (components: ComponentInstancesFromTypes<T>) => void;
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
		init?: (entity: Entity, components: ComponentInstancesFromTypes<T>) => void
	): void {
		this.createEntityCommands.push({ componentTypes, init });
	}

	public attach<T extends ComponentTypes>(
		entity: Entity,
		componentTypes?: T,
		init?: (components: ComponentInstancesFromTypes<T>) => void
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
		// do not cache commands lengths, allowing nesting commands in callbacks
		const createEntityCommands = this.createEntityCommands;
		const attachComponentsCommands = this.attachComponentsCommands;
		const detachComponentsCommands = this.detachComponentsCommands;
		const destroyEntityCommands = this.destroyEntityCommands;
		let commandIndex;

		for (commandIndex = 0; commandIndex < createEntityCommands.length; commandIndex++) {
			const command = createEntityCommands[commandIndex];
			this.store.createEntity(command.componentTypes, command.init);
		}

		for (commandIndex = 0; commandIndex < attachComponentsCommands.length; commandIndex++) {
			const command = attachComponentsCommands[commandIndex];
			this.store.attachComponents(command.entity, command.componentTypes, command.init);
		}

		for (commandIndex = 0; commandIndex < detachComponentsCommands.length; commandIndex++) {
			const command = detachComponentsCommands[commandIndex];
			this.store.detachComponents(command.entity, command.componentTypes);
		}

		for (commandIndex = 0; commandIndex < destroyEntityCommands.length; commandIndex++) {
			const entity = destroyEntityCommands[commandIndex];
			this.store.destroyEntity(entity);
		}

		this.clear();
	}

	public clear(): void {
		while (this.createEntityCommands.length) {
			this.createEntityCommands.pop();
		}

		while (this.attachComponentsCommands.length) {
			this.attachComponentsCommands.pop();
		}

		while (this.detachComponentsCommands.length) {
			this.detachComponentsCommands.pop();
		}

		while (this.destroyEntityCommands.length) {
			this.destroyEntityCommands.pop();
		}
	}

	public dispose(): void {
		this.clear();

		this.disposed = true;
	}
}
