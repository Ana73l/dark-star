import { System, system, World, QueryResult } from '@dark-star/ecs';

import { Shapes } from '../../../cd/shapes';

import { Collider } from '../collider.component';
import { Position } from '../../common/position.component';

@system
export class RenderCollidersSystem extends System {
    private entities: QueryResult<[typeof Position, typeof Collider]>;

    constructor(public world: World, private context: CanvasRenderingContext2D) {
        super();
        this.entities = world.query([Position, Collider]);
    }

    public execute(): void {
        const context = this.context;
        const previousStrokeStyle = context.strokeStyle;
        context.strokeStyle = 'red';
        let i;

        for (const [entities, [positions, colliders]] of this.entities) {
            const count = entities.length;

            for (i = 0; i < count; i++) {
                const position = positions[i];
                const shape = colliders[i].shape;

                switch (shape.type) {
                    case Shapes.Circle:
                        context.beginPath();
                        context.arc(
                            positions[i].x + shape.radius,
                            positions[i].y + shape.radius,
                            shape.radius,
                            0,
                            2 * Math.PI
                        );
                        context.closePath();
                        context.stroke();
                        break;
                    case Shapes.Rectangle:
                        context.strokeRect(positions[i].x, positions[i].y, shape.width, shape.height);
                }
            }
        }

        context.strokeStyle = previousStrokeStyle;
    }
}
