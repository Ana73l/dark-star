import { injectable } from '@dark-star/di';
import { System, SystemQuery, read, World } from '@dark-star/ecs';

import { Health } from '../components/health.data';

@injectable()
export class DeathSystem extends System {
	private entities!: SystemQuery<[typeof Health]>;

	public override async init() {
		this.entities = this.query([Health]);
	}

	public override async update() {
		this.entities
			.eachWithEntities([read(Health)], (entity, [health]) => {
				if (health.currentHealth <= 0) {
					// @ts-ignore
					(world as World).destroy(entity);
				}
			})
			.schedule();
	}
}
