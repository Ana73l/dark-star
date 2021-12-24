import { System, system, World, Topic, Entity } from '@dark-star/ecs';

import { CollisionTopic } from '../collision-detection/collision.topic';
import { LifeTime } from '../common/life-time.component';
import { Position } from '../common/position.component';
import { Sprite } from '../rendering/sprite.component';
import { Damage } from './damage.component';
import { Health } from './health.component';
import { Projectile } from './projectile.component';
import { Weapon } from './weapon.component';

@system
export class ProjectileCollisionSystem extends System {
    private collisions: Topic<CollisionTopic>;

    constructor(private world: World) {
        super();

        this.collisions = world.getTopic(CollisionTopic);
    }

    public execute() {
        const world = this.world;

        for (const { first, second } of this.collisions) {
            // collision with self
            if (first === second) {
                return;
            }

            // first entity is projectile
            if (world.has(first, Projectile)) {
                this.collision(first, second);
            } else if (world.has(second, Projectile)) {
                this.collision(second, first);
            }
        }
    }

    private collision(projectileId: Entity, other: Entity) {
        const world = this.world;

        const projectile = world.get(projectileId, Projectile);

        // collision with shooter
        if (other === projectile?.shooter) {
            return;
        }
        // if second entity is projectile as well - do nothing
        if (world.has(other, Projectile)) {
            return;
        }

        // if projectile has damage
        const damage = world.get(projectileId, Damage);
        if (damage) {
            const health = world.get(other, Health);

            if (health) {
                health.currentHealth -= damage.value;
            }
        }

        // display explosion
        // @ts-ignore
        const weapon = world.get(projectile.shooter, Weapon);
        if (weapon) {
            const position = world.get(projectileId, Position) as Position;

            world.spawn([Sprite, Position, LifeTime], (entity, [sprite, expPosition, lifeTime]) => {
                sprite.image = weapon.projectileImpactSprite;
                sprite.width = 30;
                sprite.height = 30;

                expPosition.x = position.x;
                expPosition.y = position.y;

                lifeTime.lifeSpan = 0.1;
            });
        }

        // bullets destroy on collision
        world.destroy(projectileId);
    }
}
