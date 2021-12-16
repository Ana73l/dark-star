import { component } from '@dark-star/ecs';
import { Vector2 } from '../../cd/math/vector2';

@component
export class Position implements Vector2 {
    x: number = 0;
    y: number = 0;
}
