import { System, SystemQuery, write, entities, group } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Keyboard, Keys } from '../providers/keyboard.provider';

import { Movement } from '../components/movement.data';
import { Player } from '../components/player.tag';
import { InputGroup } from './input-group.system';

@injectable()
@group(InputGroup)
export class PlayerMovementInput extends System {
	@entities([Player, Movement])
	public entities!: SystemQuery<[typeof Player, typeof Movement]>;

	constructor(private keyboard: Keyboard) {
		super();
	}

	public override async init() {
		this.keyboard.attach(window as any);
	}

	public override async update() {
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

	public override async destroy() {
		this.keyboard.detach();
	}
}
