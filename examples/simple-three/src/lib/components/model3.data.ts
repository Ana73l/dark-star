import { component } from '@dark-star/ecs';
import { int32, string16 } from '@dark-star/shared-object';

@component()
export class Model3 {
	@int32()
	scale: number = 1;

	@string16(30)
	model: string = '';
}
