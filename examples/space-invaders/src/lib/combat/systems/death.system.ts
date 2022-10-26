import { injectable } from '@dark-star/di';
import { System, Query, read } from '@dark-star/ecs';
import { WorkerWorld } from 'packages/ecs/src/threads/worker-world';

import { Health } from '../components/health.data';

@injectable()
export class DeathSystem extends System {
	private entities!: Query<[typeof Health]>;

	public override init(): void {
		this.entities = this.query([Health]);
	}

	public override async update(): Promise<void> {
		this.entities
			.eachWithEntities([read(Health)], (entity, [health]) => {
				if (health.currentHealth <= 0) {
					// @ts-ignore
					(world as WorkerWorld).destroy(entity);
				}
			})
			.schedule();
	}
}