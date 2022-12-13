import { entities, group, System, SystemQuery, updateAfter, write } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Collider } from '../components/collider.data';
import { DetectCollisions } from './detect-collisions.system';
import { SimulationGroup } from './simulation-group.system';

@injectable()
@group(SimulationGroup)
@updateAfter(DetectCollisions)
export class ClearColisions extends System {
	@entities([Collider])
	public collidables!: SystemQuery<[typeof Collider]>;

	public override async update() {
		this.collidables
			.each([write(Collider)], ([collider]) => {
				collider.collidesWith = 0;
			})
			.scheduleParallel();
	}
}
