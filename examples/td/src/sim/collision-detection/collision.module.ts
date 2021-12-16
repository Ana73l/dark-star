import { Module } from '@dark-star/ecs';

import { BroadphaseSystem } from './broadphase.system';
import { NarrowphaseSystem } from './narrowphase.system';
import { CollisionPreventionSystem } from './collision-prevention.system';
import { CollisionProvider } from './collision.provider';
import { CollisionTopic } from './collision.topic';

export const collisionsModule: Module = {
    systems: [BroadphaseSystem, NarrowphaseSystem, CollisionPreventionSystem],
    singletons: [CollisionProvider],
    topics: [CollisionTopic]
};
