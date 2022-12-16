import { Entity } from '../../entity';
import { ComponentType } from '../../component/component';
import { ComponentQueryDescriptor, ComponentTypes, QueryRecord } from '../../query';
import { ComponentLookup } from '../../threads/jobs/job-transferables/component-lookup';
import { ComponentChunksArray } from '../../threads/jobs/job-transferables/component-chunks-array';

import { System } from '../planning/__internals__';
import { EntityChunksArray } from '../../threads';

/**
 * Provides a mechanism for iterating and invoking a lambda expression on each {@link Entity} selected by a {@link System.query query}.
 */
export abstract class SystemQueryBase<TAll extends ComponentTypes, TSome extends ComponentTypes = [], TNone extends ComponentTypes = []> {
	/**
	 * @internal
	 * Creates a SystemQuery instance.
	 *
	 * @remarks
	 * Used internally in a {@link Planner} to create system queries.
	 *
	 * @see
	 * {@link System.query}\
	 * {@link entities}\
	 * {@link SystemType.queries}
	 *
	 * @param system - {@link System} that has registered the query
	 * @param query - Persistent {@link QueryRecord} containing layout of the query and matching archetypes
	 * @param withChanges - Only include chunks that have been written to since last {@link System system} update.
	 */
	constructor(protected system: System, protected query: QueryRecord, protected withChanges: boolean = false) {}

	/**
	 * Include only chunks that have been written to since last {@link System system} update.
	 *
	 * @returns The SystemQuery instance
	 */
	public withChangedFilter(): SystemQueryBase<TAll, TSome, TNone> {
		this.withChanges = true;

		return this;
	}

	/**
	 * Registers a {@link ComponentLookup} with {@link Entity entities} filtered by the query.
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
	 * {@link Entity Entities} are filtered by the query.
	 *
	 * Unlike {@link System.getComponentLookup}, this method can be called in the {@link System.update} method.
	 *
	 * @see
	 * {@link System.getComponentLookup}\
	 * {@link ComponentLookup}\
	 * {@link World.get}
	 *
	 * @param componentAccessDescriptor - Type of component instances that will be retrieved and their access flag
	 * @returns The {@link ComponentLookup}
	 *
	 * @example
	 * ```ts
	 * @injectable()
	 * class FollowPlayerEntities extends System {
	 * 	@entities([Position, Follow, Translation])
	 * 	public following!: SystemQuery<[typeof Position, typeof Follow, typeof Translation]>;
	 *
	 * 	// entities with Player and Position component and their Position component instances
	 *	private playerPositions!: ComponentLookup<ReadComponentAccess<typeof Position>>;
	 *
	 * 	public override async init() {
	 * 		// Position of target entity will not be written to so readonly access is assigned
	 * 		this.playerPositions = this.query([Player, Position]).getComponentLookup(read(Position));
	 *
	 * 		// alternatively, a query can be assigned here and getComponentLookup can be used in update
	 * 		// this.playerPositionsQuery = this.query([Player, Position]);
	 * 	}
	 *
	 * 	public override async update() {
	 * 		// alternatively, playerPositions can be assigned here
	 * 		// this.playerPositions = this.playerPositionsQuery.getComponentLookup(read(Position));
	 *
	 * 		this.following
	 * 			.each([write(Translation), read(Position), read(Follow)], [this.playerPositions], ([translation, position, follow], [playerPositions]) => {
	 * 				// get position of followed entity
	 * 				const followedPosition = playerPositions[follow.entity];
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
	public getComponentLookup<T extends ComponentQueryDescriptor | ComponentType>(componentAccessDescriptor: T): ComponentLookup<T> {
		return new ComponentLookup(componentAccessDescriptor, this.query);
	}

	/**
	 * Retrieves a {@link ComponentChunksArray} with {@link component component instances} filtered by the query.
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
	 * Unlike {@link System.getComponentChunksArray}, this method can be called in the {@link System.update} method.
	 *
	 * @see
	 * {@link ComponentChunksArray}\
	 * {@link System.getComponentChunksArray}
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
	 *	private collidableEntities!: EntityChunksArray;
	 *
	 * 	public override async init() {
	 * 		this.positions = this.collidables.getComponentChunksArray(read(Position));
	 * 		this.colliders = this.collidables.getComponentChunksArray(Collider);
	 * 		this.collidableEntities = this.collidables.getEntityChunksArray();
	 * 	}
	 *
	 * 	public override async update() {
	 * 		this.jobWithCode([this.collidableEntities, this.positions, this.colliders], ([entities, positions, colliders]) => {
	 * 			const chunksCount = entities.length; // always same as positions, colliders.length if part of same query
	 *
	 * 			for(let currentEntityRow = 0; currentEntityRow < chunksCount; currentEntityRow++) {
	 * 				const currentOuterComponentArraySize = entities[currentEntityRow].size; // always same as positions, colliders[currentEntityRow].size if part of same query
	 *
	 * 				for(let currentEntityIndex = 0; currentEntityIndex < currentOuterComponentArraySize; currentEntityIndex++) {
	 * 					const entityA = entities[currentEntityRow][currentEntityIndex];
	 * 					const positionA = positions[currentEntityRow][currentEntityIndex];
	 * 					const colliderA = colliders[currentEntityRow][currentEntityIndex];
	 *
	 * 					for(let otherEntityRow = 0; otherEntityRow < chunksCount; otherEntityRow++) {
	 * 						const currentInnerComponentArraySize = entities[otherEntityRow].size;
	 *
	 * 						for(let otherEntityIndex = 0; otherEntityIndex < currentInnerComponentArraySize; otherEntityIndex++) {
	 * 							const otherEntity = entities[otherEntityRow][otherEntityIndex];
	 * 							const positionB = positions[otherEntityRow][otherEntityIndex];
	 * 							const colliderB = colliders[otherEntityRow][otherEntityIndex];
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
	public getComponentChunksArray<T extends ComponentQueryDescriptor | ComponentType>(
		componentAccessDescriptor: T
	): ComponentChunksArray<T> {
		return new ComponentChunksArray(componentAccessDescriptor, this.query);
	}

	/**
	 * Retrieves a {@link EntityChunksArray} with {@link Entity entities} filtered by the query.
	 *
	 * @remarks
	 * {@link Job Jobs} cannot call or be nested in other jobs, which prevents N^2 iteration of {@link component components} and their {@link Entity entities}, but a EntityChunksArray can be passed as a parameter to jobs.
	 *
	 * The EntityChunksArray should only be passed as a parameter to a {@link Job job}.
	 * EntityChunksArray does not have entries outside of a {@link Job job} callback and thus should not be used outside a {@link Job job}.
	 *
	 * @see
	 * {@link EntityChunksArray}\
	 * {@link SystemQuery.getComponentChunksArray}
	 *
	 * @returns The {@link EntityChunksArray}
	 */
	public getEntityChunksArray(): EntityChunksArray {
		return new EntityChunksArray(this.query);
	}
}
