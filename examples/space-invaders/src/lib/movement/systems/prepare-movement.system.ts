import { System, Query, entities, write, read } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Velocity } from '../components/velocity.data';
import { Movement } from '../components/movement.data';

@injectable()
export class PrepareMovementSystem extends System {
	@entities([Velocity, Movement])
	private entities!: Query<[typeof Velocity, typeof Movement]>;

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
