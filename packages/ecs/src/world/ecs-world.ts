import { assert } from '@dark-star/core';
import { Container, ContainerBuilder } from '@dark-star/di';
import { WorkerPool } from '@dark-star/worker-pool';

import { ComponentType } from '../component';
import { Entity } from '../entity';
import { ComponentInstancesFromTypes, OptionalComponentPartialsFromTypes } from '../query';
import { DeferredCommandsProcessor } from '../storage/deferred-commands-processor';
import { EntityStore } from '../storage/store';
import { System, SystemType } from '../system';
import { Planner } from '../system/planning/planner';
import { $planner } from '../system/planning/__internals__';
import { SystemProcessor } from '../system/systems-processor';
import { ECSJobScheduler } from '../threads/ecs-job-scheduler';
import { createWorkerGlobalScope } from '../threads/worker-global-scope';

import { World, WorldUpdateVersion } from './world';

export type WorldParams = {
	systems: SystemType[];
	containerBuilder: ContainerBuilder;
	threads: number;
};

export class ECSWorld implements World {
	private store!: EntityStore;
	private deferredCommands!: DeferredCommandsProcessor;
	private injectablesContainer!: Container;
	private jobScheduler?: ECSJobScheduler;
	private workerPool?: WorkerPool;
	private systemProcessor!: SystemProcessor;
	private disposed: boolean = false;
	private stepInProgress: boolean = false;
	private runPromise?: Promise<void>;
	private _version: WorldUpdateVersion = 0;

	private constructor() {}

	public static async create({ systems, containerBuilder, threads }: WorldParams): Promise<World> {
		const world: ECSWorld = new ECSWorld();
		world.store = new EntityStore();
		world.deferredCommands = new DeferredCommandsProcessor(world.store);

		containerBuilder.registerSingleton(World, world);
		world.injectablesContainer = containerBuilder.build();

		// init systems
		const systemInstances: System[] = systems.map((systemType) => world.injectablesContainer.get(systemType));
		const planner = new Planner(world.store, systemInstances);

		for (const system of systemInstances) {
			system[$planner] = planner;

			// add queries marked by decorator to instance
			System.injectQueryInSystemInstance(system);

			system.init();

			// remove planner from system to enforce query creation during init phase
			system[$planner] = undefined;
		}

		// if threaded
		if (threads > 0) {
			world.workerPool = new WorkerPool({
				threads,
				workerScript: createWorkerGlobalScope(),
			});
			world.jobScheduler = new ECSJobScheduler(world.workerPool, world.deferredCommands);
			planner.addSchedulerToJobFactories(world.jobScheduler);
		}

		world.systemProcessor = new SystemProcessor(planner.createSystemRoot());

		planner.dispose();

		return world;
	}

	public get isStepInProgress(): boolean {
		return this.stepInProgress;
	}

	public get version(): WorldUpdateVersion {
		return this._version;
	}

	public get isDisposed(): boolean {
		return this.disposed;
	}

	public spawn<T extends ComponentType[]>(): void;
	public spawn<T extends ComponentType[]>(componentTypes: T): void;
	public spawn<T extends ComponentType[]>(componentTypes: T, init?: OptionalComponentPartialsFromTypes<T>): void;
	public spawn<T extends ComponentType[]>(
		componentTypes: T,
		init: (...components: ComponentInstancesFromTypes<T>) => void
	): void;
	public spawn<T extends ComponentType[]>(
		componentTypes?: T,
		init?: (...components: ComponentInstancesFromTypes<T>) => void | OptionalComponentPartialsFromTypes<T>
	): void {
		this.deferredCommands.create(componentTypes, init);
	}

	public exists(entity: Entity): boolean {
		return this.store.exists(entity);
	}

	public has<T extends ComponentType>(entity: Entity, componentType: T): boolean {
		return this.store.hasComponent(entity, componentType);
	}

	public get<T extends ComponentType>(entity: Entity, componentType: T): InstanceType<T> | undefined {
		return this.store.getComponent(entity, componentType);
	}

	public attach<T extends ComponentType[]>(entity: Entity, componentTypes: T): void;
	public attach<T extends ComponentType[]>(
		entity: Entity,
		componentTypes: T,
		init?: OptionalComponentPartialsFromTypes<T>
	): void;
	public attach<T extends ComponentType[]>(
		entity: Entity,
		componentTypes: T,
		init: (...components: ComponentInstancesFromTypes<T>) => void
	): void;
	public attach<T extends ComponentType[]>(
		entity: Entity,
		componentTypes: T,
		init?: (...components: ComponentInstancesFromTypes<T>) => void | OptionalComponentPartialsFromTypes<T>
	): void {
		this.deferredCommands.attach(entity, componentTypes, init);
	}

	public detach<T extends ComponentType[]>(entity: Entity, componentTypes: T): void {
		this.deferredCommands.detach(entity, componentTypes);
	}

	public destroy(entity: Entity): void {
		this.deferredCommands.destroy(entity);
	}

	public async step(deltaT?: number): Promise<void> {
		assert(!this.isDisposed, 'Cannot schedule a step in a disposed world.');

		if (this.runPromise) {
			return this.runPromise;
		}

		this.stepInProgress = true;

		this.runPromise = new Promise<void>(async (resolve) => {
			this.deferredCommands.process();
			await this.systemProcessor.execute(this._version, deltaT);

			this._version++;
			this.stepInProgress = false;

			resolve();
		});

		return this.runPromise;
	}

	public async dispose(): Promise<void> {
		if (this.runPromise) {
			await this.runPromise;
		}

		this.disposed = true;

		this.jobScheduler?.dispose();
		this.deferredCommands.dispose();
		await this.workerPool?.dispose();
		this.runPromise = undefined;
	}
}
