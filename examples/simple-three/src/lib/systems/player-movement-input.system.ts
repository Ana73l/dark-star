import { System, SystemQuery, write, entities, group } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Keyboard, Keys } from '../providers/keyboard.provider';

import { MovementControl } from '../components/movement-control.data';
import { Player } from '../components/player.tag';
import { InputGroup } from './input-group.system';

@injectable()
@group(InputGroup)
export class PlayerMovementInput extends System {
	@entities([Player, MovementControl])
	public entities!: SystemQuery<[typeof Player, typeof MovementControl]>;

	constructor(private keyboard: Keyboard) {
		super();
	}

	public override async init() {
		this.keyboard.attach(window as any);
	}

	public override async update() {
		const keyboard = this.keyboard;
		const forward = keyboard.pressed(Keys.W) || keyboard.pressed(Keys.UP);
		const backward = keyboard.pressed(Keys.S) || keyboard.pressed(Keys.DOWN);
		const left = keyboard.pressed(Keys.Q);
		const right = keyboard.pressed(Keys.E);

		await this.entities
			.each([write(MovementControl)], [forward, backward, left, right], ([movement], [forward, backward, left, right]) => {
				movement.forward = forward;
				movement.backward = backward;
				movement.left = left;
				movement.right = right;
			})
			.scheduleParallel();
	}

	public override async destroy() {
		this.keyboard.detach();
	}
}
