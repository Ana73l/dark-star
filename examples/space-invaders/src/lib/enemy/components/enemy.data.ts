import { component } from '@dark-star/ecs';
import { uint8 } from '@dark-star/shared-object';

@component()
export class Enemy {
	@uint8()
	row: number = 0;

	@uint8()
	column: number = 0;
}
