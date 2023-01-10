import { System, SystemQuery, write, entities, group } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Keyboard, Keys } from '../providers/keyboard.provider';

import { Player } from '../components/player.tag';
import { InputGroup } from './input-group.system';
import { RotationControl } from '../components/rotation-control.data';

@injectable()
@group(InputGroup)
export class PlayerRotationInput extends System {
	@entities([Player, RotationControl])
	public entities!: SystemQuery<[typeof Player, typeof RotationControl]>;

	constructor(private keyboard: Keyboard) {
		super();
	}

	public override async update() {
		const keyboard = this.keyboard;
		const rotatingLeft = keyboard.pressed(Keys.A) || keyboard.pressed(Keys.LEFT);
		const rotatingRight = keyboard.pressed(Keys.D) || keyboard.pressed(Keys.RIGHT);

		await this.entities
			.each([write(RotationControl)], [rotatingLeft, rotatingRight], ([rotationControl], [left, right]) => {
				rotationControl.left = left;
				rotationControl.right = right;
			})
			.scheduleParallel();
	}
}
