import { System, World, Query, entities, write, read } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Velocity } from './velocity.data';
import { Movement } from './movement.data';

@injectable()
export class PrepareMovementSystem extends System {
	private entities!: Query<[typeof Velocity, typeof Movement]>;

	public override init() {
		this.entities = this.query([Velocity, Movement]);
	}

	public override async update() {
		this.entities
			.each([write(Velocity), read(Movement)], ([velocity, movement]) => {
				if (movement.up) {
					velocity.y -= movement.speed;
				}
				if (movement.down) {
					velocity.y += movement.speed;
				}
				if (movement.left) {
					velocity.x -= movement.speed;
				}
				if (movement.right) {
					velocity.x += movement.speed;
				}
			})
			.schedule();
	}
}
