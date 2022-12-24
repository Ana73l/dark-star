import {
	ComponentChunksArray,
	entities,
	EntityChunksArray,
	group,
	read,
	ReadComponentAccess,
	System,
	SystemQuery,
	updateAfter
} from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Position } from '../components/position.data';
import { Collider } from '../components/collider.data';

import { SimulationGroup } from './simulation-group.system';
import { ApplyMovement } from './apply-movement.system';

/**
 * Inefficient N^2 collision detection.
 *
 * @remarks
 * This {@link System} displays the usage of the following features:
 * - {@link entities} decorator
 * - {@link SystemQuery.getComponentChunksArray} and {@link ComponentChunksArray} usage
 * - {@link System.jobWithCode}
 *
 * The N^2 collision testing will be sufficient in this scenario since the
 * [Space Invaders](https://en.wikipedia.org/wiki/Space_Invaders) game does not have many entities
 * and it will be executed on a background thread.
 */
@injectable()
@group(SimulationGroup)
@updateAfter(ApplyMovement)
export class DetectCollisions extends System {
	@entities([Position, Collider])
	public collidables!: SystemQuery<[typeof Position, typeof Collider]>;

	private positions!: ComponentChunksArray<ReadComponentAccess<typeof Position>>;
	private colliders!: ComponentChunksArray<typeof Collider>;
	private collidableEntities!: EntityChunksArray;

	public override async init() {
		this.positions = this.collidables.getComponentChunksArray(read(Position));
		this.colliders = this.collidables.getComponentChunksArray(Collider);
		this.collidableEntities = this.collidables.getEntityChunksArray();
	}

	public override async update() {
		this.jobWithCode([this.collidableEntities, this.positions, this.colliders], ([entities, positions, colliders]) => {
			const chunksCount = entities.length;

			// iterate all chunks
			for (let currentEntityRow = 0; currentEntityRow < chunksCount; currentEntityRow++) {
				const rowSize = entities[currentEntityRow].size;

				// iterate each component array in the chunks
				entitiesCycle: for (let currentEntityIndex = 0; currentEntityIndex < rowSize; currentEntityIndex++) {
					const currentEntity = entities[currentEntityRow][currentEntityIndex];
					const currentEntityPosition = positions[currentEntityRow][currentEntityIndex];
					const currentEntityCollider = colliders[currentEntityRow][currentEntityIndex];

					// collision already detected - do not test further
					if (currentEntityCollider.collidesWith) {
						continue entitiesCycle;
					}

					for (let otherEntityRow = 0; otherEntityRow < chunksCount; otherEntityRow++) {
						const otherRowSize = entities[otherEntityRow].size;

						for (let otherEntityIndex = 0; otherEntityIndex < otherRowSize; otherEntityIndex++) {
							const otherEntity = entities[otherEntityRow][otherEntityIndex];
							const otherEntityPosition = positions[otherEntityRow][otherEntityIndex];
							const otherEntityCollider = colliders[otherEntityRow][otherEntityIndex];

							// do not test collisions with self
							if (currentEntity === otherEntity) {
								continue;
							}

							// collision already detected - do not test further
							if (otherEntityCollider.collidesWith) {
								continue;
							}

							// test for collisions
							if (
								currentEntityPosition.x + currentEntityCollider.width >= otherEntityPosition.x &&
								currentEntityPosition.x <= otherEntityPosition.x + otherEntityCollider.width &&
								currentEntityPosition.y + currentEntityCollider.height >= otherEntityPosition.y &&
								currentEntityPosition.y <= otherEntityPosition.y + otherEntityCollider.height
							) {
								// collision detected
								currentEntityCollider.collidesWith = otherEntity;
								otherEntityCollider.collidesWith = currentEntity;

								// do not test further collisions for same entity
								continue entitiesCycle;
							}
						}
					}
				}
			}
		}).schedule();
	}
}
