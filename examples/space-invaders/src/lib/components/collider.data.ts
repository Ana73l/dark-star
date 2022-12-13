import { component, Entity } from '@dark-star/ecs';
import { float64, uint32 } from '@dark-star/shared-object';

@component()
export class Collider {
	@float64()
	width: number = 0;

	@float64()
	height: number = 0;

	@uint32()
	collidesWith: Entity = 0;
}
