import { Entity } from '../../../entity';
import { ComponentType } from '../../../component/component';
import { ComponentAccessFlags, ComponentQueryDescriptor, QueryRecord, ReadComponentAccess, WriteComponentAccess } from '../../../query';

import { $componentAccessDescriptor, $query } from '../__internals__';

/**
 * Key-value pairs representing {@link Entity entities} and their {@link component component} instance.
 *
 * @remarks
 * {@link World.get} cannot be used inside {@link Job jobs} scheduled on background threads, but a ComponentLookup can be passed as a parameter to jobs.
 *
 * The ComponentLookup should only be passed as a parameter to a {@link Job job} in a {@link WorldBuilder.useThreads multithreaded} {@link World world}.
 * ComponentLookup does not have entries outside of a {@link Job job} callback and thus should not be used outside a {@link Job job}.
 *
 * In a singlethreaded world {@link World.get} should be used instead as ComponentLookup is recreated in each {@link Job job} instance which introduces overhead.
 * ComponentLookup is recreated in {@link Job jobs} {@link Job.schedule scheduled} in a singlethreaded world or {@link Job.run ran} on the main thread for compatibility purposes.
 *
 * If a ComponentLookup has to be written to, {@link Job jobs} should be scheduled on a single thread to avoid [race conditions](https://en.wikipedia.org/wiki/Race_condition).
 * If there is no overlap between the specific entity data that is being read or written to directly in the job, then the job can be {@link ParallelJob.scheduleParallel scheduled parallel}.
 *
 * Cannot be initialized directly and should only be created using {@link System.getComponentLookup} or {@link SystemQuery.getComponentLookup}.
 *
 * @see
 * {@link World.get}
 *
 * @example
 * ```ts
 * @injectable()
 * class FollowEntity extends System {
 * 	@entities([Position, Follow, Translation])
 * 	public following!: SystemQuery<[typeof Position, typeof Follow, typeof Translation]>;
 *
 * 	private positions!: ComponentLookup<ReadComponentAccess<typeof Position>>;
 *
 * 	public override async init() {
 * 		// get all entities with Position component
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
 *
 * // Alternatively - System that follows only Player entities
 * @injectable()
 * class FollowPlayerEntity extends System {
 * 	// ...
 *
 * 	private playerPositions!: ComponentLookup<ReadComponentAccess<typeof Position>>;
 *
 * 	public override async init() {
 * 		this.playerPositions = this.query([Player, Position]).getComponentLookup(read(Position));
 * 	}
 *
 * 	// ...
 * }
 * ```
 */
export class ComponentLookup<T extends ComponentQueryDescriptor | ComponentType> {
	/**
	 * @internal
	 * ComponentLookup should not be initialized directly by consumers of the library.
	 */
	constructor(componentAcessDescriptor: T, query: QueryRecord) {
		this[$componentAccessDescriptor] =
			typeof componentAcessDescriptor === 'function'
				? {
						flag: ComponentAccessFlags.Write,
						type: componentAcessDescriptor
				  }
				: componentAcessDescriptor;
		this[$query] = query;
	}

	/**
	 * Key-value pairs representing {@link Entity entities} and their {@link component component} instance.
	 */
	[entity: Entity]: T extends WriteComponentAccess<infer U>
		? InstanceType<U>
		: T extends ReadComponentAccess<infer U>
		? Readonly<InstanceType<U>>
		: T extends ComponentType
		? InstanceType<T>
		: never;

	/**
	 * @internal
	 * {@link QueryRecord} from which {@link ComponentType components} of given type will be retrieved.
	 */
	[$query]: QueryRecord;
	/**
	 * @internal
	 * {@link ComponentType Component type} to be looked up and its {@link ComponentAccessFlags access flag}.
	 *
	 * @remarks
	 * Used internally to prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 */
	[$componentAccessDescriptor]: ComponentQueryDescriptor;
}
