import { component } from '@dark-star/ecs';
import { uint8 } from '@dark-star/shared-object';

@component()
export class Health {
	@uint8()
	maxHealth: number = 0;

	@uint8()
	currentHealth: number = 0;
}
