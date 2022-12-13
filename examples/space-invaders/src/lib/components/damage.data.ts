import { component } from '@dark-star/ecs';
import { int16 } from '@dark-star/shared-object';

@component()
export class Damage {
	@int16()
	value: number = 0;
}
