import { injectable } from '@dark-star/di';
import { System, SystemQuery, read, World, group, updateAfter } from '@dark-star/ecs';

import { Health } from '../components/health.data';
import { ClearColisions } from './clear-collisions.system';
import { SimulationGroup } from './simulation-group.system';

@injectable()
@group(SimulationGroup)
@updateAfter(ClearColisions)
export class Death extends System {
	private entities!: SystemQuery<[typeof Health]>;

	constructor(private world: World) {
		super();
	}

	public override async init() {
		this.entities = this.query([Health]);
	}

	public override async update() {
		this.entities
			.withEntities()
			.each([read(Health)], [this.world], (entity, [health], [world]) => {
				if (health.currentHealth <= 0) {
					world.destroy(entity);
				}
			})
			.schedule();
	}
}
