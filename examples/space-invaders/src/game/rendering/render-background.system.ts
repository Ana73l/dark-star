import { World, QueryResult, System, system } from '@dark-star/ecs';

import { Background } from './background.component';

@system
export class RenderBackgroundSystem extends System {
    private entities: QueryResult<[typeof Background]>;

    constructor(private context: CanvasRenderingContext2D, world: World) {
        super();

        this.entities = world.query([Background]);
    }

    public execute() {
        const height = this.context.canvas.clientHeight;
        const width = this.context.canvas.clientWidth;

        this.entities.each((entity, [background]) => {
            this.context.drawImage(background.image, 0, 0, width, height);
        });
    }
}
