import { System, SystemQuery, write, read, updateAfter, entities, group } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { DeltaTime } from '../providers/delta-time.provider';

import { Position } from '../components/position.data';
import { Velocity } from '../components/velocity.data';

import { PrepareMovement } from './prepare-movement.system';
import { SimulationGroup } from './simulation-group.system';

@injectable()
@group(SimulationGroup)
@updateAfter(PrepareMovement)
export class ApplyMovement extends System {
	@entities([Position, Velocity])
	public entities!: SystemQuery<[typeof Position, typeof Velocity]>;

	constructor(private deltaT: DeltaTime) {
		super();
	}

	public override async update() {
		this.entities
			.each([write(Position), read(Velocity)], [this.deltaT.value], ([position, velocity], [deltaT]) => {
				position.x += velocity.x * deltaT;
				position.y += velocity.y * deltaT;
			})
			.scheduleParallel();
	}
}
