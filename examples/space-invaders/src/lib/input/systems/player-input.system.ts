import { System, SystemQuery, write, entities } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Keyboard, Keys } from '../providers/keyboard';

import { Movement } from '../../movement/components/movement.data';
import { Player } from '../../tags/player';

@injectable()
export class PlayerInputSystem extends System {
	@entities([Player, Movement])
	public entities!: SystemQuery<[typeof Player, typeof Movement]>;

	constructor(private keyboard: Keyboard) {
		super();
	}

	public override async update(): Promise<void> {
		const keyboard = this.keyboard;
		/**
		 * Run this action on the main thread since we are accessing main thread APIs
		 */

		const left = keyboard.pressed(Keys.A) || keyboard.pressed(Keys.LEFT);
		const right = keyboard.pressed(Keys.D) || keyboard.pressed(Keys.RIGHT);

		await this.entities
			.each([write(Movement)], ([movement]) => {
				movement.left = left;
				movement.right = right;
			})
			.run();
	}
}
