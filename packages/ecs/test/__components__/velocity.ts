import { component } from '../../src/component';
import { float64 } from '@dark-star/shared-object';

@component()
export class Velocity {
	@float64()
	x: number = 0;

	@float64()
	y: number = 0;

	@float64()
	z: number = 0;
}
