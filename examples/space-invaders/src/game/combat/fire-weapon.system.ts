import { System, system, World, QueryResult } from '@dark-star/ecs';

import { Weapon } from './weapon.component';
import { Projectile } from './projectile.component';
import { Damage } from './damage.component';
import { Sprite } from '../rendering/sprite.component';
import { Collider } from '../collision-detection/collider.component';
import { AssetStore } from '../asset-store';
import { Shapes } from '../../cd/shapes';
import { Position } from '../common/position.component';
import { Velocity } from '../common/velocity.component';
import { Movement } from '../movement/movement.component';

@system
export class FireWeaponSystem extends System {
    private entities: QueryResult<[typeof Weapon, typeof Position]>;

    constructor(private world: World, private assetStore: AssetStore) {
        super();

        this.entities = world.query([Weapon, Position]);
    }

    public execute(deltaT: number) {
        const world = this.world;
        const assets = this.assetStore;

        for (const [entities, [weapons, positions]] of this.entities) {
            const count = entities.length;

            for (let i = 0; i < count; i++) {
                const weapon = weapons[i];
                const position = positions[i];

                weapon.timeSinceLastShot += deltaT;

                if (weapon.firing && weapon.timeSinceLastShot / 1000 >= weapon.fireRate) {
                    // spawn a projectile
                    world.spawn(
                        [Projectile, Sprite, Collider, Position, Movement, Damage, Velocity],
                        (projectileId, [projectile, sprite, collider, posProjectile, movement, damage]) => {
                            projectile.shooter = entities[i];
                            posProjectile.x = position.x + weapon.offset.x;
                            posProjectile.y = position.y + weapon.offset.y;

                            sprite.image = weapon.projectileSprite;
                            sprite.height = 20;
                            sprite.width = 10;

                            collider.shape = {
                                type: Shapes.Rectangle,
                                width: sprite.width,
                                height: sprite.height
                            };

                            movement.speed = weapon.projectileSpeed;

                            if (weapon.direction.x > 0) {
                                movement.right = true;
                            } else if (weapon.direction.x < 0) {
                                movement.left = true;
                            }
                            if (weapon.direction.y > 0) {
                                movement.down = true;
                            } else if (weapon.direction.y < 0) {
                                movement.up = true;
                            }

                            damage.value = weapon.damage;
                        }
                    );

                    if (weapon.fireSound) {
                        weapon.fireSound.pause();
                        weapon.fireSound.currentTime = 0;

                        weapon.fireSound.play();
                    }

                    weapon.timeSinceLastShot = 0;
                }
            }
        }
    }
}
