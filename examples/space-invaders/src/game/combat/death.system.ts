import { System, system, World, QueryResult } from '@dark-star/ecs';

import { AssetStore } from '../asset-store';

import { Health } from './health.component';

@system
export class DeathSystem extends System {
    private entities: QueryResult<[typeof Health]>;

    constructor(private world: World, private assetStore: AssetStore) {
        super();

        this.entities = world.query([Health]);
    }

    public execute(deltaT: number) {
        const world = this.world;
        const assets = this.assetStore;

        for (const [entities, [healths]] of this.entities) {
            const count = entities.length;

            for (let i = 0; i < count; i++) {
                const health = healths[i];

                if (health.currentHealth <= 0) {
                    world.destroy(entities[i]);
                }
            }
        }
    }
}
