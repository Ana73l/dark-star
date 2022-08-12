import { System, system, World, QueryResult } from '@dark-star/ecs';

import { AssetStore } from '../asset-store';

import { DamagedSprite } from './damaged-sprite.component';
import { Health } from '../combat/health.component';
import { Position } from '../common/position.component';

@system
export class RenderDamageSystem extends System {
    private entities: QueryResult<[typeof Position, typeof Health, typeof DamagedSprite]>;

    constructor(public world: World, private context: CanvasRenderingContext2D, private assetStore: AssetStore) {
        super();
        this.entities = world.query([Position, Health, DamagedSprite]);
    }

    public execute(): void {
        const assets = this.assetStore;
        const context = this.context;

        for (const [entities, [positions, healths, sprites]] of this.entities) {
            const count = entities.length;

            for (let i = 0; i < count; i++) {
                const position = positions[i];
                const health = healths[i];
                const sprite = sprites[i];

                // get damage model for current health percentage
                const currentHealthPercent = (health.currentHealth * 100) / health.maxHealth;
                let minAboveCurrentPercent: number = 100;

                for (const percentKey in sprite.percentToSprite) {
                    const percent = parseInt(percentKey);

                    if (percent >= currentHealthPercent && percent < minAboveCurrentPercent) {
                        minAboveCurrentPercent = percent;
                    }
                }

                const spriteImage = assets.getSprite(sprite.percentToSprite[minAboveCurrentPercent]);

                // if model is defined for current percentage bracket - render
                spriteImage &&
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
