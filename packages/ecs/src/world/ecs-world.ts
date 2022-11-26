import { $definition, assert, Definition, schemas } from '@dark-star/core';
import { Container, ContainerBuilder } from '@dark-star/di';
import { WorkerPool } from '@dark-star/worker-pool';

import { ComponentType } from '../component';
import { Entity } from '../entity';
import { ComponentInstancesFromTypes, ComponentTypes, OptionalComponentPartialsFromTypes } from '../query';
import { DeferredCommandsProcessor } from '../storage/deferred-commands-processor';
import { EntityStore } from '../storage/store';
import { System, SystemType } from '../system';
import { Planner } from '../system/planning/planner';
import { $planner, $scheduler } from '../system/planning/__internals__';
import { SystemProcessor } from '../system/systems-processor';
import { ECSTaskRunner } from '../threads/ecs-task-runner';
import { JobScheduler } from '../threads/job-scheduler';
// @ts-ignore
import ECSWorker from 'worker-loader?inline=no-fallback!../threads/worker-global-scope/worker.ts';

import { World, WorldUpdateVersion } from './world';

export type WorldParams = {
	systems: SystemType[];
	containerBuilder: ContainerBuilder;
	threads: number;
};

/**
 * @internal
 * Concrete implementation of {@link World}
 * {@inheritDoc World}
 */
export class ECSWorld implements World {
	private store!: EntityStore;
	private deferredCommands!: DeferredCommandsProcessor;
	private injectablesContainer!: Container;
	private jobScheduler?: JobScheduler;
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
		if (threads > 1) {
			threads = threads - 1;
			world.workerPool = WorkerPool.create({
				threads: threads,
				workerFactory: () => new ECSWorker()
			});

			const ecsTaskRunner = new ECSTaskRunner(world.workerPool);

			// register schemas in workers
			const schemasData: [string, Definition | undefined][] = schemas.map((schemaDef) => [schemaDef.name, schemaDef[$definition]]);
			const registerSchemasTasks = [];

			for(let i = 0; i < threads; i++) {
				registerSchemasTasks.push(ecsTaskRunner.registerSchemas(schemasData))
			}

			await Promise.all(registerSchemasTasks);

			world.jobScheduler = new JobScheduler(ecsTaskRunner);
			planner.addSchedulerToJobFactories(world.jobScheduler);

			// add scheduler to systems
			for (const system of systemInstances) {
				system[$scheduler] = world.jobScheduler;
			}
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

	public spawn<T extends ComponentTypes>(): void;
	public spawn<T extends ComponentTypes>(componentTypes: T): void;
	public spawn<T extends ComponentTypes>(componentTypes: T, init?: OptionalComponentPartialsFromTypes<T>): void;
	public spawn<T extends ComponentTypes>(componentTypes: T, init: (components: ComponentInstancesFromTypes<T>) => void): void;
	public spawn<T extends ComponentTypes>(
		componentTypes?: T,
		init?: (components: ComponentInstancesFromTypes<T>) => void | OptionalComponentPartialsFromTypes<T>
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

	public attach<T extends ComponentTypes>(entity: Entity, componentTypes: T): void;
	public attach<T extends ComponentTypes>(entity: Entity, componentTypes: T, init?: OptionalComponentPartialsFromTypes<T>): void;
	public attach<T extends ComponentTypes>(
		entity: Entity,
		componentTypes: T,
		init: (components: ComponentInstancesFromTypes<T>) => void
	): void;
	public attach<T extends ComponentTypes>(
		entity: Entity,
		componentTypes: T,
		init?: (components: ComponentInstancesFromTypes<T>) => void | OptionalComponentPartialsFromTypes<T>
	): void {
		this.deferredCommands.attach(entity, componentTypes, init);
	}

	public detach<T extends ComponentTypes>(entity: Entity, componentTypes: T): void {
		this.deferredCommands.detach(entity, componentTypes);
	}

	public destroy(entity: Entity): void {
		this.deferredCommands.destroy(entity);
	}

	public async step(): Promise<void> {
		assert(!this.isDisposed, 'Cannot schedule a step in a disposed world.');

		if (this.runPromise) {
			return this.runPromise;
		}

		this.stepInProgress = true;

		// @babel SyntaxError: Cannot convert non-arrow function to a function expression.
		const self = this;
		this.runPromise = new Promise<void>(async function (resolve) {
			self.store.currentWorldVersion = self._version;
			self.deferredCommands.process();
			await self.systemProcessor.execute(self._version);

			self._version++;

			self.stepInProgress = false;

			self.runPromise = undefined;

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
