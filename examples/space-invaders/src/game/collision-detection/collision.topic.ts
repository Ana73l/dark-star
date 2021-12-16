import { Entity } from '@dark-star/ecs';

export abstract class CollisionTopic {
    abstract first: Entity;
    abstract second: Entity;
}
