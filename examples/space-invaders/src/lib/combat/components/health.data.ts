import { component } from '@dark-star/ecs';
import { int16 } from '@dark-star/shared-object';

@component()
export class Health {
	@int16()
	maxHealth: number = 0;

	@int16()
	currentHealth: number = 0;
}
