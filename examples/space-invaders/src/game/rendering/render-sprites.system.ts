import { System, system, World, QueryResult } from '@dark-star/ecs';

import { Sprite } from './sprite.component';
import { Position } from '../common/position.component';
import { AssetStore } from '../asset-store';

@system
export class RenderSpritesSystem extends System {
    private entities: QueryResult<[typeof Position, typeof Sprite]>;

    constructor(public world: World, private context: CanvasRenderingContext2D, private assetStore: AssetStore) {
        super();
        this.entities = world.query([Position, Sprite]);
    }

    public execute(): void {
        const assets = this.assetStore;
        const context = this.context;
        let i;

        for (const [entities, [positions, sprites]] of this.entities) {
            const count = entities.length;

            for (i = 0; i < count; i++) {
                const position = positions[i];
                const sprite = sprites[i];
                const spriteImage = assets.getSprite(sprite.image);

                context.drawImage(
                    spriteImage,
                    0,
                    0,
                    spriteImage.width,
                    spriteImage.height,
                    position.x,
                    position.y,
                    sprite.width,
                    sprite.height
                );
            }
        }
    }
}
