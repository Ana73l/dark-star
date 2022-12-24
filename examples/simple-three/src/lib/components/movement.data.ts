import { component } from '@dark-star/ecs';
import { bool, float64 } from '@dark-star/shared-object';

@component()
export class Movement {
	@bool()
	up: boolean = false;

	@bool()
	down: boolean = false;

	@bool()
	left: boolean = false;

	@bool()
	right: boolean = false;

	@float64()
	speedX: number = 0;

	@float64()
	speedY: number = 0;
}
