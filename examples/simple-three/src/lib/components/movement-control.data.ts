import { component } from '@dark-star/ecs';
import { bool, float64 } from '@dark-star/shared-object';

@component()
export class MovementControl {
	@bool()
	forward: boolean = false;

	@bool()
	backward: boolean = false;

	@bool()
	left: boolean = false;

	@bool()
	right: boolean = false;

	@float64()
	speedForward: number = 0;

	@float64()
	speedBackward: number = 0;

	@float64()
	speedSideways: number = 0;
}
