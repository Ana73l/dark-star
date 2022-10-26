import { float64 } from '@dark-star/shared-object';
import { component } from '../../src/component';

@component()
export class Position {
	@float64()
	x: number = 0;

	@float64()
	y: number = 0;

	@float64()
	z: number = 0;
}
