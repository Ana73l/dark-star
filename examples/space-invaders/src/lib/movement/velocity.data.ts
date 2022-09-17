import { component } from '@dark-star/ecs';
import { float64 } from '@dark-star/shared-object';

@component()
export class Velocity {
	@float64()
	x!: number;

	@float64()
	y!: number;

	@float64()
	z!: number;
}
