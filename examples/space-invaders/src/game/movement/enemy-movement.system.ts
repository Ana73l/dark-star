import { QueryResult, System, system, World } from '@dark-star/ecs';
import { Position } from '../common/position.component';
import { Enemy } from '../entities/enemy.component';
import { Movement } from './movement.component';

@system
export class EnemyMovementSystem extends System {
    private entities: QueryResult<[typeof Position, typeof Movement, typeof Enemy]>;

    constructor(world: World) {
        super();

        this.entities = world.query([Position, Movement, Enemy]);
    }

    public execute() {
        // borders of enemy rectangle
        let minX = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;

        for (const [entities, [positions, movements, enemies]] of this.entities) {
            const entityCount = entities.length;

            for (let i = 0; i < entityCount; i++) {
                const position = positions[i];

                if (position.x > maxX) {
                    maxX = position.x;
                }
                if (position.x < minX) {
                    minX = position.x;
                }
            }
        }
    }
}
