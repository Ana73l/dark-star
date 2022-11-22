import { injectable } from '@dark-star/di';
import { System, SystemQuery, write, read, updateAfter, entities } from '@dark-star/ecs';
import { DeltaTime } from '../../delta-time';

import { Position } from '../components/position.data';
import { Velocity } from '../components/velocity.data';

import { PrepareMovementSystem } from './prepare-movement.system';

@injectable()
@updateAfter(PrepareMovementSystem)
export class ApplyMovementSystem extends System {
	@entities([Position, Velocity])
	public entities!: SystemQuery<[typeof Position, typeof Velocity]>;

	constructor(private deltaT: DeltaTime) {
		super();
	}

	public override async update(): Promise<void> {
		this.entities
			.eachWithEntities([write(Position), read(Velocity)], [this.deltaT.value], (entity, [position, velocity], [deltaT]) => {
				position.x += velocity.x * deltaT;
				position.y += velocity.y * deltaT;
			})
			.schedule();
	}
}
