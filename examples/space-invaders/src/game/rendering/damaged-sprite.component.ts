import { component } from '@dark-star/ecs';

@component
export class DamagedSprite {
    percentToSprite: Record<number, string> = {};
    width: number = 0;
    height: number = 0;
}
