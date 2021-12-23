import { System, system, World, QueryResult } from '@dark-star/ecs';

import { Velocity } from './velocity.component';

@system
export class ClearVelocitySytem extends System {
    private entities: QueryResult<[typeof Velocity]>;

    constructor(world: World) {
        super();

        this.entities = world.query([Velocity]);
    }

    public execute() {
        let i;

        for (const [entities, [velocities]] of this.entities) {
            const count = entities.length;

            for (i = 0; i < count; i++) {
                velocities[i].x = 0;
                velocities[i].y = 0;
            }
        }
    }
}
