import { System, SystemQuery, entities, write, read, group } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Velocity } from '../components/velocity.data';
import { MovementControl } from '../components/movement-control.data';
import { Rotation } from '../components/rotation.data';

import { SimulationGroup } from './simulation-group.system';

@injectable()
@group(SimulationGroup)
export class PrepareMovement extends System {
	@entities([Velocity, MovementControl, Rotation])
	public entities!: SystemQuery<[typeof Velocity, typeof MovementControl, typeof Rotation]>;

	public override async update() {
		this.entities
			.each([write(Velocity), read(MovementControl), read(Rotation)], ([velocity, movement, rotation]) => {
				const rotationY = rotation.y;
				const speedForward = movement.speedForward;
				const speedBackward = movement.speedBackward;
				const speedSideways = movement.speedSideways;

				if (movement.forward) {
					velocity.x += Math.sin(rotationY) * speedForward;
					velocity.z += Math.cos(rotationY) * speedForward;
				}
				if (movement.backward) {
					velocity.x -= Math.sin(rotationY) * speedBackward;
					velocity.z -= Math.cos(rotationY) * speedBackward;
				}
				if (movement.left) {
					velocity.x += Math.cos(rotationY) * speedForward;
					velocity.z += -Math.sin(rotationY) * speedForward;
				}
				if (movement.right) {
					velocity.x += -Math.cos(rotationY) * speedSideways;
					velocity.z += Math.sin(rotationY) * speedSideways;
				}
			})
			.scheduleParallel();
	}
}
