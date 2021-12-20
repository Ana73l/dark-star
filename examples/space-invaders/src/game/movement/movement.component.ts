import { component } from '@dark-star/ecs';

@component
export class Movement {
    up: boolean = false;
    down: boolean = false;
    left: boolean = false;
    right: boolean = false;
    speed: number = 0;
}
