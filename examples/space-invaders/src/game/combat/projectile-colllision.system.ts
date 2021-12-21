import { System, system, World, Topic, Entity } from '@dark-star/ecs';

import { CollisionTopic } from '../collision-detection/collision.topic';
import { Damage } from './damage.component';
import { Health } from './health.component';
import { Projectile } from './projectile.component';

@system
export class ProjectileCollisionSystem extends System {
    private collisions: Topic<CollisionTopic>;

    constructor(private world: World) {
        super();

        this.collisions = world.getTopic(CollisionTopic);
    }

    public execute() {
        const world = this.world;

        console.log(this.collisions);

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

        // entities already destroyed

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

        // bullets destroy on collision
        world.destroy(projectileId);
    }
}
