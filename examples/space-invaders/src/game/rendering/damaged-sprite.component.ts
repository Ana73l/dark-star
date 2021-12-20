import { component } from '@dark-star/ecs';

@component
export class DamagedSprite {
    percentToSprite: Record<number, HTMLImageElement> = {};
    width: number = 0;
    height: number = 0;
}
