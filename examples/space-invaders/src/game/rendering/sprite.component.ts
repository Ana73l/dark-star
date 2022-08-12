import { component } from '@dark-star/ecs';

@component
export class Sprite {
    width: number = 0;
    height: number = 0;
    image!: string;
}
