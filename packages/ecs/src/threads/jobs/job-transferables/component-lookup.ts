import { Entity } from '../../../entity';
import { ComponentType } from '../../../component/component';
import { ComponentAccessFlags, QueryRecord } from '../../../query';

import { $accessFlag, $componentType, $query } from '../__internals__';

/**
 * Key-value pairs representing {@link Entity entities} and their {@link component component} instance.
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
 * If a ComponentLookup has to be written to, {@link Job jobs} should be scheduled on a single thread to avoid [race conditions](https://en.wikipedia.org/wiki/Race_condition).
 * If there is no overlap between the specific entity data that is being read or written to directly in the job, then the job can be {@link ParallelJob.scheduleParallel scheduled parallel}.
 *
 * Cannot be initialized directly and should only be created using {@link System.getComponentLookup}.
 *
 * @see
 * {@link World.get}
 *
 * @example
 * ```ts
 * @injectable()
 * class FollowEntity extends System {
 * 	@entities([Position, Follow, Translation])
 * 	private following!: SystemQuery<[typeof Position, typeof Follow, typeof Translation]>;
 *
 * 	private positions!: ComponentLookup<Position, true>;
 *
 * 	public override async init() {
 * 		this.positions = this.getComponentLookup(Position, true);
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
export class ComponentLookup<T extends ComponentType = ComponentType, R extends boolean = false> {
	/**
	 * @internal
	 * ComponentLookup should not be initialized directly by consumers of the library.
	 */
	constructor(type: T, query: QueryRecord, readonly?: R) {
		this[$componentType] = type;
		this[$query] = query;
		this[$accessFlag] = readonly ? ComponentAccessFlags.Read : ComponentAccessFlags.Write;
	}

	/**
	 * Key-value pairs representing {@link Entity entities} and their {@link component component} instance.
	 */
	[entity: Entity]: R extends true ? Readonly<InstanceType<T>> : InstanceType<T>;

	/**
	 * @internal
	 * {@link ComponentType Component type} to be looked up.
	 *
	 * @remarks
	 * Used internally during serializing for/ deserializing on background threads.
	 */
	[$componentType]: T;
	/**
	 * @internal
	 * {@link QueryRecord} from which {@link ComponentType components} of given type will be retrieved.
	 */
	[$query]: QueryRecord;
	/**
	 * @internal
	 * Used internally to prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 */
	[$accessFlag]: ComponentAccessFlags;
}
