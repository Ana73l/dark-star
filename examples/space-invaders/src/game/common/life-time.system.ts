import { System, system, World, QueryResult } from '@dark-star/ecs';

import { LifeTime } from './life-time.component';

@system
export class LifeTimeSystem extends System {
    private entities: QueryResult<[typeof LifeTime]>;

    constructor(private world: World) {
        super();

        this.entities = world.query([LifeTime]);
    }

    public execute(deltaT: number) {
        const world = this.world;
        let i;

        for (const [entities, [lifeTimes]] of this.entities) {
            const count = entities.length;

            for (i = 0; i < count; i++) {
                const lifeTime = lifeTimes[i];

                lifeTime.lifeSpan -= deltaT / 1000;

                if (lifeTime.lifeSpan <= 0) {
                    world.destroy(entities[i]);
                }
            }
        }
    }
}
