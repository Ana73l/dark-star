import { component } from '@dark-star/ecs';
import { int32 } from '@dark-star/shared-object';

@component()
export class Health {
	@int32()
	maxHealth!: number;

	@int32()
	currentHealth!: number;
}
