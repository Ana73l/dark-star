import { System, system, World, QueryResult } from '@dark-star/ecs';

import { Keyboard, Keys } from '../../inputs/keyboard';
import { Movement } from '../../movement/movement.component';
import { Weapon } from '../../combat/weapon.component';

import { Player } from './player.component';

@system
export class PlayerInputSystem extends System {
    private entities: QueryResult<[typeof Player], [typeof Movement, typeof Weapon]>;

    constructor(world: World, private keyboard: Keyboard) {
        super();
        this.entities = world.query([Player], [Movement, Weapon]);
    }

    public execute() {
        const keyboard = this.keyboard;
        let i;

        const left = keyboard.pressed(Keys.A) || keyboard.pressed(Keys.LEFT);
        const right = keyboard.pressed(Keys.D) || keyboard.pressed(Keys.RIGHT);
        const isShooting = keyboard.pressed(Keys.SPACE);

        for (const [entities, , [movementIntentions, weapons]] of this.entities) {
            const count = entities.length;

            for (i = 0; i < count; i++) {
                const movement = movementIntentions[i];
                const weapon = weapons[i];

                if (movement) {
                    movement.left = left;
                    movement.right = right;
                }
                if (weapon) {
                    weapon.firing = isShooting;
                }
            }
        }
    }
}
