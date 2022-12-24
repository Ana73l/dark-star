import { Entity, component } from '@dark-star/ecs';
import { uint32 } from '@dark-star/shared-object';

@component()
export class Projectile {
    @uint32()
    shooter: Entity = -1;
}