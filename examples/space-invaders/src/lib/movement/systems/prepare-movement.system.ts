import { System, SystemQuery, entities, write, read } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Velocity } from '../components/velocity.data';
import { Movement } from '../components/movement.data';

@injectable()
export class PrepareMovement extends System {
	@entities([Velocity, Movement])
	public entities!: SystemQuery<[typeof Velocity, typeof Movement]>;

	public override async update() {
		this.entities
			.each([write(Velocity), read(Movement)], ([velocity, movement]) => {
				if (movement.up) {
					velocity.y -= movement.speedY;
				}
				if (movement.down) {
					velocity.y += movement.speedY;
				}
				if (movement.left) {
					velocity.x -= movement.speedX;
				}
				if (movement.right) {
					velocity.x += movement.speedX;
				}
			})
			.scheduleParallel();
	}
}
