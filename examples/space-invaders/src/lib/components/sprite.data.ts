import { component } from '@dark-star/ecs';
import { float64, string16 } from '@dark-star/shared-object';

@component()
export class Sprite {
	@float64()
	width: number = 0;

	@float64()
	height: number = 0;

	@string16(30)
	image!: string;
}
