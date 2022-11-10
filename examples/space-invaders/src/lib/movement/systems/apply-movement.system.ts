import { injectable } from '@dark-star/di';
import { System, Query, write, read, updateAfter } from '@dark-star/ecs';

import { Position } from '../components/position.data';
import { Velocity } from '../components/velocity.data';

import { PrepareMovementSystem } from './prepare-movement.system';

@injectable()
@updateAfter(PrepareMovementSystem)
export class ApplyMovementSystem extends System {
	private entities!: Query<[typeof Position, typeof Velocity]>;

	public override init(): void {
		this.entities = this.query([Position, Velocity]);
	}

	public override async update(): Promise<void> {
		this.entities
			.eachWithEntities([write(Position), read(Velocity)], (entity, [position, velocity]) => {
				position.x += velocity.x;
				position.y += velocity.y;

				console.log(entity, position.x, position.y);
			})
			.schedule();
	}
}
