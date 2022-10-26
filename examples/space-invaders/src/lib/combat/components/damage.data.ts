import { component } from '@dark-star/ecs';
import { int32 } from '@dark-star/shared-object';

@component()
export class Damage {
	@int32()
	value!: number;
}
