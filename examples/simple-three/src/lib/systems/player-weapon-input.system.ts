import { System, SystemQuery, write, entities, group, updateAfter } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Keyboard, Keys } from '../providers/keyboard.provider';

import { Player } from '../components/player.tag';
import { Weapon } from '../components/weapon.data';
import { InputGroup } from './input-group.system';
import { PlayerMovementInput } from './player-movement-input.system';

@injectable()
@group(InputGroup)
@updateAfter(PlayerMovementInput)
export class PlayerWeaponInput extends System {
	@entities([Player, Weapon])
	public entities!: SystemQuery<[typeof Player, typeof Weapon]>;

	constructor(private keyboard: Keyboard) {
		super();
	}

	public override async update() {
		const keyboard = this.keyboard;
		/**
		 * Run this action on the main thread since we are accessing main thread APIs
		 */
		const isFiring = keyboard.pressed(Keys.SPACE);

		await this.entities
			.each([write(Weapon)], ([weapon]) => {
				weapon.isFiring = isFiring;
			})
			.run();
	}
}
