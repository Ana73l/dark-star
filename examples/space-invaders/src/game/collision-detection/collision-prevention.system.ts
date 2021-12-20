import { system, System, Topic, World } from '@dark-star/ecs';

import { Position } from '../common/position.component';
import { Velocity } from '../common/velocity.component';
import { Collider } from './collider.component';

import { CollisionTopic } from './collision.topic';

@system
export class CollisionPreventionSystem extends System {
    private collisionTopic: Topic<CollisionTopic>;

    constructor(private world: World) {
        super();

        this.collisionTopic = world.getTopic(CollisionTopic);
    }

    public execute(deltaT: number): void {
        const world = this.world;

        // for (const pair of this.collisionTopic) {
        //     const colliderA = world.get(pair.first, Collider) as Collider;
        //     const velocityA = world.get(pair.first, Velocity);
        //     const positionA = world.get(pair.first, Position) as Position;

        //     const colliderB = world.get(pair.second, Collider) as Collider;
        //     const velocityB = world.get(pair.second, Velocity);
        //     const positionB = world.get(pair.second, Position) as Position;

        //     if (velocityA) {
        //     }
        //     if (velocityB) {
        //     }
        // }
    }
}
