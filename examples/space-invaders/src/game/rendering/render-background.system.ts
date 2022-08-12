import { World, QueryResult, System, system } from '@dark-star/ecs';
import { AssetStore } from '../asset-store';

import { Background } from './background.component';

@system
export class RenderBackgroundSystem extends System {
    private entities: QueryResult<[typeof Background]>;

    constructor(private context: CanvasRenderingContext2D, world: World, private assetStore: AssetStore) {
        super();

        this.entities = world.query([Background]);
    }

    public execute() {
        const assets = this.assetStore;
        const height = this.context.canvas.clientHeight;
        const width = this.context.canvas.clientWidth;

        this.entities.each((entity, [background]) => {
            this.context.drawImage(assets.getSprite(background.image), 0, 0, width, height);
        });
    }
}
