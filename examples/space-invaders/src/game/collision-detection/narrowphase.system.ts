import { Entity, system, System, Topic, World } from '@dark-star/ecs';
import { shapesCollide } from '../../cd/collisions';
import { Position } from '../common/position.component';
import { Collider } from './collider.component';

import { CollisionProvider } from './collision.provider';
import { CollisionTopic } from './collision.topic';

@system
export class NarrowphaseSystem extends System {
    private collisionTopic: Topic<CollisionTopic>;
    private checked: Map<Entity, boolean> = new Map();

    constructor(private collisionProvider: CollisionProvider, world: World) {
        super();

        this.collisionTopic = world.getTopic(CollisionTopic);
    }

    public execute(): void {
        const collisionTopic = this.collisionTopic;
        const quadtree = this.collisionProvider.quadtree;
        const entityColliders = this.collisionProvider.entityColliders;
        const checked = this.checked;

        const all = quadtree.getAll();

        for (const eaabb of all) {
            const current = eaabb[4];

            const possibleCollisions = quadtree.getPossibleCollisions(eaabb);

            for (const other of possibleCollisions) {
                if (current !== other && !checked.has(other)) {
                    const [currentPosition, currentCollider] = entityColliders.get(current) as [Position, Collider];
                    const [otherPosition, otherCollider] = entityColliders.get(other) as [Position, Collider];

                    if (shapesCollide(currentCollider.shape, otherCollider.shape, currentPosition, otherPosition)) {
                        collisionTopic.push({ first: current, second: other });
                    }
                }
            }

            checked.set(current, true);
        }

        checked.clear();
    }
}
