import { cleanupComponent, Entity } from '@dark-star/ecs';
import { uint32 } from '@dark-star/shared-object';

@cleanupComponent()
export class ThreeObject {
	@uint32()
	entity: Entity = 0;
}
