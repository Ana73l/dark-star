import { QueryResult, System, system, World } from '@dark-star/ecs';
import { Position } from '../../common/position.component';
import { Velocity } from '../../common/velocity.component';
import { Enemy } from './enemy.component';
import { Movement } from '../../movement/movement.component';

enum Directions {
    Left,
    Right
}

@system
export class EnemyMovementSystem extends System {
    private entities: QueryResult<[typeof Position, typeof Movement, typeof Velocity, typeof Enemy]>;

    constructor(world: World) {
        super();

        this.entities = world.query([Position, Movement, Velocity, Enemy]);
    }

    public execute() {
        // borders of enemy rectangle
        let minX = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;

        for (const [entities, [positions]] of this.entities) {
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

        if (minX <= 35) {
            this.changeDirection(Directions.Right);
        }
        if (maxX >= 1420) {
            this.changeDirection(Directions.Left);
        }
    }

    private changeDirection(direction: Directions) {
        for (const [entities, [, movements, velocities]] of this.entities) {
            const entityCount = entities.length;

            for (let i = 0; i < entityCount; i++) {
                const movement = movements[i];
                const velocity = velocities[i];

                if (direction === Directions.Left) {
                    movement.right = false;
                    movement.left = true;
                } else {
                    movement.right = true;
                    movement.left = false;
                }

                velocity.y += 2;
            }
        }
    }
}
