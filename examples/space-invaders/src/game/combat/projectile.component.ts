import { component, Entity } from '@dark-star/ecs';

@component
export class Projectile {
    shooter!: Entity;
}
