import { assert } from '@dark-star/core';

import { ComponentType } from '../component/component';
import { ComponentQueryDescriptor, ComponentTypes } from '../query';
import { WorldUpdateVersion } from '../world';
import { Job, JobHandle, JobArgs, JobCallbackMappedArgs } from '../threads/jobs/job';
import { JobScheduler } from '../threads/job-scheduler';
import { ECSJobWithCode } from '../threads/jobs/ecs-job-with-code';
import { ComponentLookup } from '../threads/jobs/job-transferables/component-lookup';
import { ComponentChunksArray } from '../threads/jobs/job-transferables/component-chunks-array';

import { $planner, $scheduler, Planner, System as ISystem } from './planning/__internals__';
import { SystemQuery } from './query-factories/system-query';

/**
 * Utility type representing possible {@link System system} static properties.
 */
export type SystemStaticProperties = {
	/**
	 * {@link System} before which current system should be executed if both systems are in the same group.
	 *
	 * @see
	 * {@link updateBefore}
	 */
	updateBefore?: SystemType;
	/**
	 * {@link System} after which current system should be executed if both systems are in the same group.
	 *
	 * @see
	 * {@link updateAfter}
	 */
	updateAfter?: SystemType;
	/**
	 * {@link SystemGroup} to which current system belongs.
	 *
	 * @see
	 * {@link group}
	 */
	updateInGroup?: SystemType<SystemGroup>;
	/**
	 * Key-Value pairs representing [name of field] - [{@link SystemQuery}] which will automatically be injected on {@link System} {@link System.init initialization}.
	 *
	 * @see
	 * {@link entities}\
	 * {@link System.query}
	 */
	queries?: Record<string, [all: ComponentTypes, some?: ComponentTypes, none?: ComponentTypes]>;
};

/**
 * Utility type representing a {@link System system} class constructor and its possible static properties.
 */
export type SystemType<T extends System = System> = (new (...args: any[]) => T) & SystemStaticProperties;

/**
 * Base class from which all systems should inherit.
 *
 * @remarks
 * Systems are the 'S' in [ECS](https://en.wikipedia.org/wiki/Entity_component_system).
 * All game/ simulation logic should be placed within systems.
 * They are responsible for transormation of data ({@link component components}) from its current to its next state.
 * Quering data can be done using its {@link System.query query} method or the {@link entities} decorator.
 *
 * Systems {@link System.update run} on the main thread based on the system's {@link System.active active} and {@link System.tickRate tickRate} properties.
 *
 * Logic that runs on background threads in {@link WorldBuilder.useThreads multithreaded} {@link World world} can be scheduled within the system's {@link System.update update} method using its {@link System.jobWithCode jobWithCode} method or using its {@link System.query query} {@link Job} factory.
 *
 * Systems can be injected and injected in to.
 * Systems must be decorated with the {@link injectable} decorator.
 *
 * @example
 * ```ts
 * @injectable()
 * class ApplyVelocity extends System {
 * 	@entities([Position, Velocity])
 * 	public moveables!: SystemQuery<[typeof Position, typeof Velocity]>;
 *
 * 	constructor(private deltaT: DeltaTime) {
 * 		super();
 * 	}
 *
 * 	public override async update() {
 * 		this.moveables
 * 			.each([write(Position), read(Velocity)], [this.deltaT.value], ([position, velocity], [deltaT]) => {
 * 				position.x += velocity.x * deltaT;
 * 				position.y += velocity.y * deltaT;
 * 				position.z += velocity.z * deltaT;
 * 			})
 * 			.scheduleParallel();
 * 	}
 * }
 * ```
 */
export abstract class System implements ISystem {
	/**
	 * Indicates whether the system instance is active for execution.
	 *
	 * @remarks
	 * Used internally (along with {@link System.tickRate} and {@link System.ticksSinceLastExecution} properties) to determine whether system should execute during the current {@link World.step step}.
	 */
	public active: boolean = true;
	/**
	 * Indicates the tick rate of the system.
	 *
	 * @remarks
	 * Used internally (along with {@link System.active} and {@link System.ticksSinceLastExecution} properties) to determine whether system should execute during the current {@link World.step step}.
	 * {@link System.tickRate tickRate} represents the interval of execution.
	 * For example, a {@link System.tickRate tickRate} of 2 indicates that the system will be executed every second world {@link World.step step}.
	 *
	 * @example
	 * ```ts
	 * @injectable()
	 * class Physics extends System {
	 * 	// system will be executed every 4th world step
	 * 	public override tickRate: number = 4;
	 * }
	 * ```
	 * @example
	 * ```ts
	 * @injectable()
	 * class Physics extends System {
	 * 	constructor() {
	 * 		// alternatively tickRate can be set in the constructor
	 * 		this.tickRate = 4;
	 * 	}
	 * }
	 * ```
	 */
	public tickRate: number = 1;
	/**
	 * Number of {@link World.step steps} since last system execution.
	 *
	 * @remarks
	 * Used internally (along with {@link System.active} and {@link System.tickRate} properties) to determine whether system should execute during the current {@link World.step step}.
	 * Should not be manually set.
	 */
	public ticksSinceLastExecution: number = 1;
	/**
	 * Combined {@link Job jobs} scheduled during the previous execution of the system.
	 *
	 * @remarks
	 * Set only in a {@link WorldBuilder.useThreads multithreaded} {@link World world}.
	 * Any {@link Job jobs} scheduled using {@link SystemQuery queries} or {@link System.jobWithCode jobWithCode} will automatically be added to the {@link System.dependency dependency} property.
	 * Completed internally before {@link System.update update} is called.
	 * Can be referenced and set as dependee for other {@link Job jobs}.
	 * Should not be manually set.
	 */
	public dependency?: JobHandle;
	public lastWorldVersion: WorldUpdateVersion = -1;

	/**
	 * @internal
	 * Injects persistent {@link SystemQuery queries} in the target system instance based on its static `queries` property.
	 * Used internally during the {@link World.create world create} phase.
	 *
	 * @param target - {@link System} instance
	 */
	public static injectQueryInSystemInstance(target: System): void {
		const queries = (target.constructor as SystemType).queries;

		if (queries) {
			for (const [property, query] of Object.entries(queries)) {
				(target as any)[property] = target.query(...query);
			}
		}
	}

	/**
	 * Called when the system is created.
	 *
	 * @remarks
	 * Override to set up system resources when it is created.
	 * Typically used to register {@link SystemQuery persistent queries}.
	 *
	 * @example
	 * @injectable()
	 * class RenderSprites extends System {
	 * 	// ...
	 * 	public override async init() {
	 * 		this.sprites = this.query([Position, Sprite]);
	 * 	}
	 * }
	 */
	public async init() {}

	/**
	 * Invoked once every {@link System.tickRate} {@link World.step steps}.
	 *
	 * @remarks
	 * Override to perform the major work of the system.
	 *
	 * The update() function is ran on the main thread but can be used to schedule {@link Job jobs} using the {@link System.query query} and {@link System.jobWithCode jobWithCode} methods.
	 *
	 * Entity commands: {@link World.spawn spawn}, {@link World.attach attach}, {@link World.detach detach}, {@link World.destroy destroy} can be used in {@link Job jobs} if {@link World} is passed as a parameter to the job.
	 *
	 * Entity accessors ({@link World.has has}, {@link World.get get}, {@link World.exists exists}) can be invoked only from the main thread and cannot be used in {@link Job jobs}.
	 *
	 * @example
	 * ```ts
	 * @injectable()
	 * class RenderSprites extends System {
	 * 	// ...
	 *
	 * 	public override async update() {
	 * 		const context = this.renderingContext;
	 * 		const assetStore = this.assetStore;
	 *
	 * 		// run on the main thread since main thread APIs/ providers are used
	 * 		await this.sprites
	 * 			.each([read(Sprite), read(Position)], ([sprite, position]) => {
	 * 				const image = assetStore.getSprite(sprite.image);
	 * 				context.drawImage(image, 0, 0, image.width, image.height, position.x, position.y, sprite.width, sprite.height);
	 * 			})
	 * 			.run();
	 * 	}
	 * }
	 *
	 * @injectable()
	 * class ApplyVelocity extends System {
	 * 	// ...
	 *
	 * 	public override async update() {
	 * 		// schedule work to be done on multiple background threads
	 * 		this.moveables
	 * 			.each([write(Position), read(Velocity)], [this.deltaT.value], ([position, velocity], [deltaT]) => {
	 * 				position.x += velocity.x * deltaT;
	 * 				position.y += velocity.y * deltaT;
	 * 				position.z += velocity.z * deltaT;
	 * 			})
	 * 			.scheduleParallel();
	 * 	}
	 * }
	 * ```
	 */
	public abstract update(): Promise<void>;

	/**
	 * Called when the System is destroyed.
	 *
	 * @remarks
	 * Override to free resources used by the system.
	 */
	public async destroy(): Promise<void> {}

	/**
	 * Completes all {@link Job jobs} (if in a {@link WorldBuilder.useThreads multithreaded} {@link World world}) operating on data described with a {@link ComponentQueryDescriptor component access descriptors} array.
	 *
	 * @remarks
	 * If {@link World.get} needs to be used (only available on main thread) - {@link Job jobs} using those {@link component components} need to be {@link JobHandle.complete completed} before retrieving the component instance in order to prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 *
	 * @param componentQueryDescriptors - {@link ComponentQueryDescriptor Component access descriptors}
	 *
	 * @example
	 * ```ts
	 * @injectable()
	 * class ApplyProjectileDamage extends System {
	 * 	@entities([Projectile, CollisionWith, Damage])
	 * 	public projectiles: SystemQuery<[typeof Projectile, typeof Collision, typeof Damage]>;
	 *
	 * 	constructor(private world: World) {
	 * 		super();
	 * 	}
	 *
	 * 	// ...
	 * 	public override async update() {
	 * 		const world = this.world;
	 *
	 * 		// complete jobs accessing Health component since we use World.get
	 * 		await this.completeJobs([write(Health)]);
	 *
	 * 		await this.projectiles
	 * 			.each([read(CollisionWith), read(Damage)], ([collisionWith, damage]) => {
	 * 				if(world.has(collisionWith.entity, Health)) {
	 * 					const health = world.get(collisionWith.entity, Health);
	 *
	 * 					health.currentHealth -= damage.value;
	 * 				}
	 * 			})
	 * 			.run();
	 * 	}
	 * }
	 *
	 * @injectable()
	 * class ClearRenderingContext extends System {
	 * 	constructor(private context: CanvasRenderingContext2D) {
	 * 		super();
	 * 	}
	 *
	 * 	public override async update() {
	 * 		// complete jobs on components relevant to rendering before proceeding
	 * 		await this.completeJobs([read(Sprite), read(Position)]);
	 * 		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
	 * 	}
	 * }
	 * ```
	 */
	protected async completeJobs(componentQueryDescriptors: ComponentQueryDescriptor[]): Promise<void> {
		if (this[$scheduler]) {
			await this[$scheduler].completeJobs(this[$scheduler].getDependencies(componentQueryDescriptors));
		}
	}

	/**
	 * Registers a persistent {@link SystemQuery query}.
	 *
	 * @remarks
	 * The query is automatically updated. Queries are used to retrieve entities with given sets of components and provide mechanisms for scheduling {@link Job jobs}.
	 *
	 * Can be called only in the {@link System.init init} method.
	 *
	 * @see
	 * Alternatively queries can be registered using the {@link entities} decorator.
	 *
	 * @param all - Include archetypes that have every component in this list
	 * @param some - Include archetypes that have any component in this list (or none)
	 * @param none - Exclude archetypes that have any component in this list
	 * @returns The persistent {@link SystemQuery} query
	 *
	 * @example
	 * ```ts
	 * @injectable()
	 * class ApplyVelocity extends System {
	 * 	private moveables!: SystemQuery<[typeof Position, typeof Velocity]>;
	 *
	 * 	public override async init() {
	 * 		// include all entities having both Position and Velocity
	 * 		this.moveables = this.query([Position, Velocity]);
	 * 	}
	 *
	 * 	// ...
	 * }
	 *
	 * @injectable()
	 * class ApplyDamage extends System {
	 * 	// ...
	 *
	 * 	public override async init() {
	 * 		// include entities having both IncomingDamage and Health, exclude entities having Immune
	 * 		this.damageables = this.query([IncomingDamage, Health], [], [Immune]);
	 * 	}
	 * }
	 * ```
	 */
	protected query<TAll extends ComponentTypes, TSome extends ComponentTypes = [], TNone extends ComponentTypes = []>(
		all: TAll,
		some?: TSome,
		none?: TNone
	): SystemQuery<TAll, TSome, TNone> {
		assert(
			this[$planner] !== undefined,
			`Error registering query in system ${this.constructor.name}: Cannot register query before or after system initialization`
		);

		return this[$planner]!.registerSystemQuery(this)(all, some, none);
	}

	/**
	 * Registers a persistent {@link ComponentLookup component lookup}.
	 *
	 * @remarks
	 * {@link World.get} cannot be used inside {@link Job jobs} scheduled on background threads, but a {@link ComponentLookup} can be passed as a parameter to jobs.
	 *
	 * The {@link ComponentLookup} should only be passed as a parameter to a {@link Job job} in a {@link WorldBuilder.useThreads multithreaded} {@link World world}.
	 * {@link ComponentLookup} does not have entries outside of a {@link Job job} callback and thus should not be used outside a {@link Job job}.
	 *
	 * In a singlethreaded world {@link World.get} should be used instead as {@link ComponentLookup} is recreated in each {@link Job job} instance which introduces overhead.
	 * {@link ComponentLookup} is recreated in {@link Job jobs} {@link Job.schedule scheduled} in a singlethreaded world or {@link Job.run ran} on the main thread for compatibility purposes.
	 *
	 * Can be called only in the {@link System.init init} method.
	 *
	 * @see
	 * {@link ComponentLookup}\
	 * {@link World.get}
	 *
	 * @param componentType - Include all entities and their component instances having this type
	 * @param readonly - True if access is read-only
	 * @returns The persistent {@link ComponentLookup}
	 *
	 * @example
	 * ```ts
	 * @injectable()
	 * class FollowEntity extends System {
	 * 	@entities([Position, Follow, Translation])
	 * 	public following!: SystemQuery<[typeof Position, typeof Follow, typeof Translation]>;
	 *
	 * 	// all entities with Position component and the corresponding component instances
	 * 	private positions!: ComponentLookup<ReadComponentAccess<typeof Position>>;
	 *
	 * 	public override async init() {
	 * 		// Position of target entity will not be written to so readonly access is assigned
	 * 		this.positions = this.getComponentLookup(read(Position));
	 * 	}
	 *
	 * 	public override async update() {
	 * 		this.following
	 * 			.each([write(Translation), read(Position), read(Follow)], [this.positions], ([translation, position, follow], [positions]) => {
	 * 				// get position of followed entity
	 * 				const followedPosition = positions[follow.entity];
	 *
	 * 				// check if followed entity has position and implement follow logic
	 * 				if(followedPosition) {
	 * 					// ...
	 * 				}
	 * 			})
	 * 			.scheduleParallel();
	 * 	}
	 * }
	 * ```
	 */
	protected getComponentLookup<T extends ComponentType | ComponentQueryDescriptor>(componentAccessDescriptor: T): ComponentLookup<T> {
		assert(
			this[$planner] !== undefined,
			`Error registering ComponentLookup in system ${this.constructor.name}: Cannot register ComponentLookup before or after system initialization`
		);

		const componentType =
			typeof componentAccessDescriptor === 'function' ? (componentAccessDescriptor as ComponentType) : componentAccessDescriptor.type;

		return this[$planner].registerSystemQuery(this)([componentType]).getComponentLookup(componentAccessDescriptor);
	}

	/**
	 * Registers a persistent {@link ComponentChunksArray} with {@link component component instances} filtered by the query.
	 *
	 * @remarks
	 * {@link Job Jobs} cannot call or be nested in other jobs, which prevents N^2 iteration of {@link component components}, but a ComponentChunksArray can be passed as a parameter to jobs.
	 *
	 * The ComponentChunksArray should only be passed as a parameter to a {@link Job job}.
	 * ComponentChunksArray does not have entries outside of a {@link Job job} callback and thus should not be used outside a {@link Job job}.
	 *
	 * If a ComponentChunksArray has to be written to, {@link Job jobs} should be scheduled on a single thread to avoid [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 * If there is no overlap between the specific entity data that is being read or written to directly in the job, then the job can be {@link ParallelJob.scheduleParallel scheduled parallel}.
	 *
	 * @see
	 * {@link ComponentChunksArray}\
	 * {@link SystemQuery.getComponentChunksArray}
	 *
	 * @param componentAccessDescriptor - Type of component arrays that will be retrieved and their access flag
	 * @returns The {@link ComponentChunksArray}
	 *
	 * @example
	 * ```ts
	 * @injectable()
	 * class CheckCollisions extends System {
	 * 	@entities([Position, Collider])
	 * 	public collidables!: SystemQuery<[typeof Position, typeof Collider]>
	 *
	 * 	private positions!: ComponentChunksArray<ReadComponentAccess<typeof Position>>;
	 * 	private colliders!: ComponentChunksArray<typeof Collider>;
	 *
	 * 	public override async init() {
	 * 		this.positions = this.collidables.getComponentChunksArray(read(Position));
	 * 		this.colliders = this.collidables.getComponentChunksArray(Collider);
	 * 	}
	 *
	 * 	public override async update() {
	 * 		this.jobWithCode([this.positions, this.colliders], ([positions, colliders]) => {
	 * 			const chunksCount = positions.length; // always same as colliders.length if part of same query
	 *
	 * 			for(let outerI = 0; outerI < chunksCount; outerI++) {
	 * 				const currentOuterComponentArraySize = positions[outerI].size; // always same as colliders[outerI].size if part of same query
	 *
	 * 				for(let outerJ = 0; outerJ < currentOuterComponentArraySize; outerJ++) {
	 * 					const positionA = positions[outerI][outerJ];
	 * 					const colliderA = colliders[outerI][outerJ];
	 *
	 * 					for(let innerI = 0; innerI < chunksCount; innerI++) {
	 * 						const currentInnerComponentArraySize = positions[innerI].size;
	 *
	 * 						for(let innerJ = 0; innerJ < currentInnerComponentArraySize; innerJ++) {
	 * 							const positionB = positions[innerI][innerJ];
	 * 							const colliderB = colliders[innerI][innerJ];
	 *
	 * 							// apply collision detection logic using positionA, colliderA, positionB, colliderB
	 * 							// ...
	 * 						}
	 * 					}
	 * 				}
	 * 			}
	 * 		}).schedule();
	 * 	}
	 * }
	 * ```
	 */
	protected getComponentChunksArray<T extends ComponentType | ComponentQueryDescriptor>(
		componentAccessDescriptor: T
	): ComponentChunksArray<T> {
		assert(
			this[$planner] !== undefined,
			`Error registering ComponentChunksArray in system ${this.constructor.name}: Cannot register ComponentChunksArray before or after system initialization`
		);

		const componentType =
			typeof componentAccessDescriptor === 'function' ? (componentAccessDescriptor as ComponentType) : componentAccessDescriptor.type;

		return this[$planner].registerSystemQuery(this)([componentType]).getComponentChunksArray(componentAccessDescriptor);
	}

	/**
	 * Provides a mechanism for defining and executing {@link Job jobs}.
	 *
	 * @param callback - Function to be executed with no arguments
	 *
	 * @example
	 * ```ts
	 * @injectable()
	 * class LogSystem extends System {
	 * 	// ...
	 *
	 * 	public override async update() {
	 * 		this.jobWithCode(() => {
	 * 			console.log('Logged from jobWithCode, possibly from a background thread when schedule() is called in a multithreaded world.');
	 * 		}).schedule();
	 * 	}
	 * }
	 * ```
	 */
	protected jobWithCode(callback: () => void): Job;
	/**
	 * Provides a mechanism for defining and executing {@link Job jobs}.
	 *
	 * @param params - List of arguments that will be passed to the callback function
	 * @param callback - Function to be executed
	 *
	 * @remarks
	 * Data passed to background threads is copied, not shared as described [here](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#transferring_data_to_and_from_workers_further_details),
	 * which introduces performance overhead of serializing and deserializing the parameters. This also means data is not shared between threads, so any change to the parameters will not be reflected on other threads.
	 * If data needs to be modified/ retrieved from background threads, [SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) must be used.
	 *
	 * @example
	 * ```ts
	 * @injectable()
	 * class AddOnePlusTwo extends System {
	 * 	// ...
	 * 	public override async update() {
	 * 		// buffer size for result
	 * 		const bufferSize = Uint8Array.BYTES_PER_ELEMENT;
	 * 		// buffer to be written to
	 * 		const buffer = new SharedArrayBuffer(bufferSize);
	 *
	 * 		// execute on background thread and wait for the result
	 * 		await this.jobWithCode([buffer], ([resultBuffer]) => {
	 * 			// TypedArray view allowing writing to the buffer from a background thread
	 * 			const resultArray = new Uint8Array(resultBuffer);
	 *
	 * 			resultArray[0] = 1 + 2;
	 * 		})
	 * 			.schedule()
	 * 			.complete();
	 *
	 * 		// data is safe to be accessed from main thread after job completion
	 * 		console.log(new Uint8Array(buffer)[0]); // 3
	 * 	}
	 * }
	 * ```
	 */
	protected jobWithCode<T extends JobArgs>(params: T, callback: (args: JobCallbackMappedArgs<T>) => void): Job;
	protected jobWithCode<T extends JobArgs>(params: T | (() => void), callback?: (args: JobCallbackMappedArgs<T>) => void): Job {
		if (typeof callback === 'function') {
			return new ECSJobWithCode(this, callback, params as T, this[$scheduler]);
		} else {
			return new ECSJobWithCode(this, params as () => void, [], this[$scheduler]);
		}
	}

	/**
	 * @internal
	 * {@link JobScheduler} used to schedule and complete jobs.
	 *
	 * @remarks
	 * Injected only if the {@link World world} to which system instance belongs uses more than one thread.
	 */
	[$scheduler]?: JobScheduler;
	/**
	 * @internal
	 * {@link Planner} used to create {@link SystemQuery queries} and calculate order of systems in a world.
	 *
	 * @remarks
	 * Injected before {@link System.init} is called and removed after to prevent {@link SystemQuery query} registration after the system has been initialized.
	 */
	[$planner]?: Planner;
}

/**
 * Represents a list of related {@link System systems} that should be updated together in a specific order.
 *
 * @remarks
 * SystemGroup extends {@link System} so it behaves like a system and can be ordered relative to other {@link System systems}.
 * System groups can be nested in other {@link SystemGroup system groups}, forming a hierarchy.
 * Any {@link System system} without a system group will be added to the root system group.
 *
 * @see
 * {@link group} - Grouping systems\
 * {@link updateBefore} - Ordering systems in a group\
 * {@link updateAfter} - Ordering systems in a group\
 * {@link SystemType} - Possible static properties for a {@link System system} constructor
 *
 * @example
 * ```ts
 * @injectable()
 * class RenderingGroup extends SystemGroup {}
 *
 * @injectable()
 * @group(RenderingGroup)
 * @updateAfter(ClearRenderingContext)
 * class RenderSprites extends System {
 * 	// ...
 * }
 *
 * // alternatively an 'updateInGroup' static property can be declared
 * @injectable()
 * class ClearRenderingContext extends System {
 * 	public static updateInGroup: SystemGroup = RenderingGroup;
 *
 * 	// ...
 * }
 * ```
 */
export abstract class SystemGroup extends System {
	public readonly systems: System[] = [];

	public override async update(): Promise<void> {}

	public flatten(): (System | SystemGroup)[] {
		const systemsInGroup = this.systems;
		const systems = [];

		for (const system of systemsInGroup) {
			systems.push(system);

			if (Reflect.has(system, 'systems')) {
				systems.push(...(system as SystemGroup).flatten());
			}
		}

		return systems;
	}
}
