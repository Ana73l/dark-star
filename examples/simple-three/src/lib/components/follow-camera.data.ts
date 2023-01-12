import { component, Entity } from '@dark-star/ecs';
import { uint32, float64 } from '@dark-star/shared-object';

@component()
export class FollowCamera {
	@uint32()
	following: Entity = 0;

	@float64()
	targetOffsetX: number = 0;

	@float64()
	targetOffsetY: number = 0;

	@float64()
	targetOffsetZ: number = 0;

	@float64()
	targetLookAtX: number = 0;

	@float64()
	targetLookAtY: number = 0;

	@float64()
	targetLookAtZ: number = 0;
}
