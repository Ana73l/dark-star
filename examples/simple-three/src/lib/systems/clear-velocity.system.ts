import { System, updateBefore, SystemQuery, write, entities, group } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Velocity } from '../components/velocity.data';

import { PrepareMovement } from './prepare-movement.system';
import { SimulationGroup } from './simulation-group.system';

@injectable()
@group(SimulationGroup)
@updateBefore(PrepareMovement)
export class ClearVelocity extends System {
	@entities([Velocity])
	public entities!: SystemQuery<[typeof Velocity]>;

	public override async update() {
		this.entities
			.each([write(Velocity)], ([velocity]) => {
				velocity.x = 0;
				velocity.y = 0;
				velocity.z = 0;
			})
			.schedule();
	}
}
