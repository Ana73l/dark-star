import { component } from '@dark-star/ecs';

@component
export class ShootingIntention {
    fireRate: number = 1;
    firing: boolean = false;
}
