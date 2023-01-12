import { System, SystemQuery, entities, write, read, group } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Rotation } from '../components/rotation.data';
import { RotationControl } from '../components/rotation-control.data';

import { SimulationGroup } from './simulation-group.system';
import { DeltaTime } from '../providers/delta-time.provider';

@injectable()
@group(SimulationGroup)
export class ApplyRotationControl extends System {
	@entities([RotationControl, Rotation])
	public entities!: SystemQuery<[typeof RotationControl, typeof Rotation]>;

	constructor(private deltaT: DeltaTime) {
		super();
	}

	public override async update() {
		this.entities
			.each([write(Rotation), read(RotationControl)], [this.deltaT.value], ([rotation, rotationControl], [deltaT]) => {
				const rotationSpeed = rotationControl.speed;

				if (rotationControl.left) {
					rotation.y += rotationSpeed * deltaT;
				}
				if (rotationControl.right) {
					rotation.y -= rotationSpeed * deltaT;
				}
			})
			.scheduleParallel();
	}
}
