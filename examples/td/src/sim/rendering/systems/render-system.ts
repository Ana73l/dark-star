import { System, system, World, QueryResult } from '@dark-star/ecs';

import { Sprite } from '../components/sprite';
import { Shape, Shapes } from '../components/shape';
import { Position } from '../../components/position';

@system
export class RenderSystem implements System {
    private entities: QueryResult<[typeof Position, typeof Shape]>;

    constructor(public world: World, private context: CanvasRenderingContext2D) {
        this.entities = world.query([Position, Shape]);
    }

    public execute(deltaT: number): void {
        const context = this.context;
        const canvas = this.context.canvas;
        let i;

        context.clearRect(0, 0, canvas.width, canvas.height);

        for (const [entities, [positions, shapes]] of this.entities) {
            const count = entities.length;

            for (i = 0; i < count; i++) {
                switch (shapes[i].shape) {
                    case Shapes.Circle:
                        context.fillStyle = shapes[i].color;

                        context.beginPath();
                        context.arc(positions[i].x, positions[i].y, shapes[i].radius as number, 0, 2 * Math.PI);
                        context.fill();
                        context.closePath();
                        context.stroke();
                        break;
                    case Shapes.Rectangle:
                        context.fillStyle = shapes[i].color;

                        context.fillRect(
                            positions[i].x,
                            positions[i].y,
                            shapes[i].width as number,
                            shapes[i].height as number
                        );
                }
            }
        }
    }
}
