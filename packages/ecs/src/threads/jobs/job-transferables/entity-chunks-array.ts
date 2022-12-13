import { Entity } from 'packages/ecs/src/entity';
import { QueryRecord } from '../../../query';

import { $query } from '../__internals__';

/**
 * Array of {@link Entity} arrays.
 *
 * @remarks
 * {@link Job Jobs} cannot call or be nested in other jobs, which prevents N^2 iteration of {@link component components} and their {@link Entity entities}, but a ComponentChunksArray can be passed as a parameter to jobs.
 *
 * The EntityChunksArray should only be passed as a parameter to a {@link Job job}.
 * EntityChunksArray does not have entries outside of a {@link Job job} callback and thus should not be used outside a {@link Job job}.
 *
 * Cannot be initialized directly and should only be created using {@link SystemQuery.getEntitiesArray}.
 *
 * @see
 * {@link SystemQuery.getComponentChunksArray}
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
export class EntityChunksArray {
	public readonly length: number = 0;

	/**
	 * @internal
	 * EntityChunksArray should not be initialized directly by consumers of the library.
	 */
	constructor(query: QueryRecord) {
		this[$query] = query;
	}

	/**
	 * {@link Entity Entity Arrays}
	 */
	[index: number]: Omit<Readonly<Entity[]>, 'length'> & { size: number };

	/**
	 * @internal
	 * {@link QueryRecord} from which {@link Entity entities} will be retrieved.
	 */
	[$query]: QueryRecord;
}
