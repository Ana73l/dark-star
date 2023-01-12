import { component } from '@dark-star/ecs';
import { float64, string16 } from '@dark-star/shared-object';

@component()
export class Model {
	@float64()
	scale: number = 1;

	@string16(30)
	model: string = '';
}
