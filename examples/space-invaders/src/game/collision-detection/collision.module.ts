import { Module } from '@dark-star/ecs';

import { BroadphaseSystem } from './broadphase.system';
import { NarrowphaseSystem } from './narrowphase.system';
import { CollisionProvider } from './collision.provider';
import { CollisionTopic } from './collision.topic';

const collisionModule: Module = {
    systems: [BroadphaseSystem, NarrowphaseSystem],
    singletons: [CollisionProvider],
    topics: [CollisionTopic]
};

export default collisionModule;
