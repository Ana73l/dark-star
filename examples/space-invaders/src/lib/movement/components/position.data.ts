import { component } from '@dark-star/ecs';
import { float64 } from '@dark-star/shared-object';

@component()
export class Position {
	@float64()
	x: number = 0;

	@float64()
	y: number = 0;
}
