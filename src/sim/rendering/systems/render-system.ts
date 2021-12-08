import { System, system, World, QueryResult } from '@dark-star/ecs';

import { Sprite } from '../components/sprite';
import { Shape, Shapes } from '../components/shape';
import { Position } from '../../components/position';

@system
export class RenderSystem extends System {
    private entities: QueryResult<[typeof Position, typeof Shape]>;

    constructor(world: World, private context: CanvasRenderingContext2D) {
        super();

        this.entities = world.query([Position, Shape]);
    }

    public execute(deltaT: number): void {
        const context = this.context;
        const canvas = this.context.canvas;

        context.clearRect(0, 0, canvas.width, canvas.height);

        for (const [entities, [positions, shapes]] of this.entities) {
            const count = entities.length;
            let i;

            for (i = 0; i < count; i++) {
                if (shapes[i].shape === Shapes.Circle) {
                    context.fillStyle = 'red';

                    context.beginPath();
                    context.arc(positions[i].x, positions[i].y, shapes[i].radius as number, 0, Math.PI);
                    context.fill();
                    context.closePath();
                    context.stroke();
                }
            }
        }
    }
}
