import { injectable } from '@dark-star/di';
import { System, Query, write, read, updateAfter } from '@dark-star/ecs';

import { Position } from './position.data';
import { PrepareMovementSystem } from './prepare-movement.system';
import { Velocity } from './velocity.data';

@injectable()
@updateAfter(PrepareMovementSystem)
export class ApplyMovementSystem extends System {
	private entities!: Query<[typeof Position, typeof Velocity]>;

	public override init(): void {
		this.entities = this.query([Position, Velocity]);
	}

	public override async update(): Promise<void> {
		this.entities
			.each([write(Position), read(Velocity)], ([position, velocity]) => {
				position.x += velocity.x;
				position.y += velocity.y;
			})
			.schedule();
	}
}
