import { component } from '@dark-star/ecs';
import { string16 } from '@dark-star/shared-object';

@component()
export class MovementAnimation {
	@string16(30)
	idle: string = '';

	@string16(30)
	run: string = '';

	@string16(30)
	walk: string = '';

	@string16(30)
	current: string = '';

	@string16(30)
	previous: string = '';
}
