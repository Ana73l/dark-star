import { component } from '@dark-star/ecs';

@component
export class Health {
    maxHealth: number = 0;
    currentHealth: number = 0;
}
