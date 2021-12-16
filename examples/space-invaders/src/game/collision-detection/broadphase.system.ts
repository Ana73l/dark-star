import { System, system, World, QueryResult } from '@dark-star/ecs';
import { shapeAABB } from '../../cd/aabb';

import { CollisionProvider } from './collision.provider';

import { Collider } from './collider.component';
import { Position } from '../common/position.component';

@system
export class BroadphaseSystem extends System {
    private entities: QueryResult<[typeof Position, typeof Collider]>;

    constructor(private collisionProvider: CollisionProvider, world: World) {
        super();
        this.entities = world.query([Position, Collider]);
    }

    public execute(): void {
        const quadtree = this.collisionProvider.quadtree;
        const entityColliders = this.collisionProvider.entityColliders;
        quadtree.clear();

        for (const [entities, [positions, colliders]] of this.entities) {
            for (let i = 0; i < entities.length; i++) {
                const aabb = shapeAABB(colliders[i].shape, positions[i]);
                quadtree.insert([aabb[0], aabb[1], aabb[2], aabb[3], entities[i]]);
                entityColliders.set(entities[i], [positions[i], colliders[i]]);
            }
        }
    }
}
