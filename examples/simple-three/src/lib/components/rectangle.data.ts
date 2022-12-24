import { component } from '@dark-star/ecs';
import { float64 } from '@dark-star/shared-object';

@component()
export class Rectangle {
	@float64()
	width: number = 0;

	@float64()
	height: number = 0;
}
