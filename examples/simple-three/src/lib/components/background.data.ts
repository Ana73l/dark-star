import { component } from '@dark-star/ecs';
import { string16 } from '@dark-star/shared-object';

@component()
export class Background {
	@string16(20)
	image!: string;
}
