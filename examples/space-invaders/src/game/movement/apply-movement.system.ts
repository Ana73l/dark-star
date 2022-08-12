import { System, system, World, QueryResult } from '@dark-star/ecs';

import { Position } from '../common/position.component';
import { Velocity } from '../common/velocity.component';

@system
export class ApplyMovementSystem extends System {
    private entities: QueryResult<[typeof Position, typeof Velocity]>;

    constructor(world: World) {
        super();

        this.entities = world.query([Position, Velocity]);
    }

    public execute(deltaT: number) {
        let i;

        for (const [entities, [positions, velocities]] of this.entities) {
            const count = entities.length;

            for (i = 0; i < count; i++) {
                positions[i].x += velocities[i].x * deltaT;
                positions[i].y += velocities[i].y * deltaT;
            }
        }
    }
}
