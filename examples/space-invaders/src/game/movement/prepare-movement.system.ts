import { System, system, World, QueryResult } from '@dark-star/ecs';

import { Velocity } from '../common/velocity.component';
import { Movement } from './movement.component';

@system
export class PrepareMovementSystem extends System {
    private entities: QueryResult<[typeof Velocity, typeof Movement]>;

    constructor(world: World) {
        super();

        this.entities = world.query([Velocity, Movement]);
    }

    public execute(deltaT: number) {
        let i;

        for (const [entities, [velocities, movements]] of this.entities) {
            const count = entities.length;

            for (i = 0; i < count; i++) {
                const movement = movements[i];
                const velocity = velocities[i];

                if (movement.up) {
                    velocity.y -= movement.speed;
                }
                if (movement.down) {
                    velocity.y += movement.speed;
                }
                if (movement.left) {
                    velocity.x -= movement.speed;
                }
                if (movement.right) {
                    velocity.x += movement.speed;
                }
            }
        }
    }
}
