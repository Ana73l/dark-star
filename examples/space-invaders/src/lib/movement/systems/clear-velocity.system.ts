import { System, updateBefore, Query, write, entities } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Velocity } from '../components/velocity.data';

import { PrepareMovementSystem } from './prepare-movement.system';

@injectable()
@updateBefore(PrepareMovementSystem)
export class ClearVelocitySytem extends System {
	@entities([Velocity])
	private entities!: Query<[typeof Velocity]>;

	public override async update() {
		await this.entities
			.each([write(Velocity)], ([velocity]) => {
				velocity.x = 0;
				velocity.y = 0;
			})
			.schedule();
	}
}