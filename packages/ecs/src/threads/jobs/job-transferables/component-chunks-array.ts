import { ComponentType } from '../../../component/component';
import { ComponentAccessFlags, ComponentQueryDescriptor, QueryRecord, ReadComponentAccess, WriteComponentAccess } from '../../../query';

import { $componentAccessDescriptor, $query } from '../__internals__';

/**
 * Array of {@link component} instances arrays.
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
 * Cannot be initialized directly and should only be created using {@link System.getComponentChunksArray} or {@link SystemQuery.getComponentChunksArray}.
 *
 * @see
 * {@link System.getComponentChunksArray}\
 * {@link SystemQuery.getComponentChunksArray}\
 * {@link EntityChunkArrays}
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
 * 			const chunksCount = entities.length; // always same as colliders.length if part of same query
 *
 * 			for(let currentEntityRow = 0; currentEntityRow < chunksCount; currentEntityRow++) {
 * 				const currentOuterComponentArraySize = entities[currentEntityRow].size; // always same as colliders[outerI].size if part of same query
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
export class ComponentChunksArray<T extends ComponentQueryDescriptor | ComponentType> {
	public length: number = 0;

	/**
	 * @internal
	 * ComponentChunksArray should not be initialized directly by consumers of the library.
	 */
	constructor(componentAccessDescriptor: T, query: QueryRecord) {
		this[$componentAccessDescriptor] =
			typeof componentAccessDescriptor === 'function'
				? {
						flag: ComponentAccessFlags.Write,
						type: componentAccessDescriptor
				  }
				: componentAccessDescriptor;
		this[$query] = query;
	}

	/**
	 * {@link component Component Arrays}
	 */
	[index: number]: T extends WriteComponentAccess<infer U>
		? Omit<Readonly<InstanceType<U>[]>, 'length'> & { size: number }
		: T extends ReadComponentAccess<infer U>
		? Omit<Readonly<Readonly<InstanceType<U>>[]>, 'length'> & { size: number }
		: T extends ComponentType
		? Omit<Readonly<InstanceType<T>[]>, 'length'> & { size: number }
		: never;

	/**
	 * @internal
	 * {@link QueryRecord} from which {@link ComponentType components} of given type will be retrieved.
	 */
	[$query]: QueryRecord;
	/**
	 * @internal
	 * {@link ComponentType Component type} to be iterated and its {@link ComponentAccessFlags access flag}.
	 *
	 * @remarks
	 * Used internally for serialization/ deserialization and to prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 */
	[$componentAccessDescriptor]: ComponentQueryDescriptor;
}
