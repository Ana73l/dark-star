import { System, SystemQuery, entities, write, read, group, updateAfter, ComponentLookup, ReadComponentAccess } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { FollowCamera } from '../components/follow-camera.data';
import { Position } from '../components/position.data';
import { LookAt } from '../components/look-at.data';

import { SimulationGroup } from './simulation-group.system';
import { ApplyMovement } from './apply-movement.system';

@injectable()
@group(SimulationGroup)
@updateAfter(ApplyMovement)
export class FollowEntityWithCamera extends System {
	@entities([FollowCamera, Position, LookAt])
	public followCameras!: SystemQuery<[typeof FollowCamera, typeof Position, typeof LookAt]>;

	@entities([Position])
	public entitiesWithPosition!: SystemQuery<[typeof Position]>;

	private positionsLookup!: ComponentLookup<ReadComponentAccess<typeof Position>>;

	public override async init() {
		this.positionsLookup = this.entitiesWithPosition.getComponentLookup(read(Position));
	}

	public override async update() {
		this.followCameras
			.each(
				[write(Position), write(LookAt), read(FollowCamera)],
				[this.positionsLookup],
				([position, lookAt, followCamera], [positions]) => {
					const followedEntity = followCamera.following;

					const followedPosition = positions[followedEntity];

					if (followedPosition) {
						const followedX = followedPosition.x;
						const followedY = followedPosition.y;
						const followedZ = followedPosition.z;

						position.x = followCamera.targetOffsetX + followedX;
						position.y = followCamera.targetOffsetY + followedY;
						position.z = followCamera.targetOffsetZ + followedZ;

						lookAt.x = followedX;
						lookAt.y = followedY;
						lookAt.z = followedZ;
					}
				}
			)
			.schedule();
	}
}
