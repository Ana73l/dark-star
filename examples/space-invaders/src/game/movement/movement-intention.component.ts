import { component } from '@dark-star/ecs';

@component
export class MovementIntention {
    forward: boolean = false;
    backward: boolean = false;
    left: boolean = false;
    right: boolean = false;
}
