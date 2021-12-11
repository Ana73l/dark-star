import { System, system, World, QueryResult } from '@dark-star/ecs';

import { Position } from './components/position';
import { Velocity } from './components/velocity';

@system
export class MovementSystem implements System {
    private entities: QueryResult<[typeof Position, typeof Velocity]>;

    constructor(world: World) {
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
