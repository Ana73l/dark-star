import { component } from '@dark-star/ecs';
import { TypedShape } from '../../cd/shapes';

@component
export class Collider {
    shape!: TypedShape;
}
