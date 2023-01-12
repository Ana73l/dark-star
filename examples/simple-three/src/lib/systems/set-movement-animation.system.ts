import { System, SystemQuery, entities, write, read, group } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { MovementControl } from '../components/movement-control.data';
import { MovementAnimation } from '../components/movement-animation.data';

import { SimulationGroup } from './simulation-group.system';

@injectable()
@group(SimulationGroup)
export class SetMovementAnimation extends System {
	@entities([MovementControl, MovementAnimation])
	public entities!: SystemQuery<[typeof MovementControl, typeof MovementAnimation]>;

	public override async update() {
		this.entities
			.each([write(MovementAnimation), read(MovementControl)], ([animation, movement]) => {
				const movingForward = movement.forward;
				const movingBackward = movement.backward;
				const movingSideways = movement.left || movement.right;

				animation.previous = animation.current;

				if ((movingForward && !movingBackward) || movingSideways) {
					animation.current = animation.run;
				} else if (!movingForward && movingBackward) {
					animation.current = animation.walk;
				} else {
					animation.current = animation.idle;
				}
			})
			.scheduleParallel();
	}
}
