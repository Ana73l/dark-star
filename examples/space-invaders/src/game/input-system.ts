import { System, system, World, QueryResult, component } from '@dark-star/ecs';

import { Keyboard, Keys } from './inputs/keyboard';
import { Movement } from './movement/movement.component';
import { Weapon } from './combat/weapon.component';

@component
export class PlayerControlled {}

@system
export class InputSystem extends System {
    private entities: QueryResult<[typeof PlayerControlled], [typeof Movement, typeof Weapon]>;

    constructor(world: World, private keyboard: Keyboard) {
        super();
        this.entities = world.query([PlayerControlled], [Movement, Weapon]);
    }

    public execute() {
        const keyboard = this.keyboard;
        let i;

        const up = keyboard.pressed(Keys.W) || keyboard.pressed(Keys.UP);
        const down = keyboard.pressed(Keys.S) || keyboard.pressed(Keys.DOWN);
        const left = keyboard.pressed(Keys.A) || keyboard.pressed(Keys.LEFT);
        const right = keyboard.pressed(Keys.D) || keyboard.pressed(Keys.RIGHT);
        const isShooting = keyboard.pressed(Keys.SPACE);

        for (const [entities, , [movementIntentions, weapons]] of this.entities) {
            const count = entities.length;

            for (i = 0; i < count; i++) {
                const movement = movementIntentions[i];
                const weapon = weapons[i];

                if (movement) {
                    movement.up = up;
                    movement.down = down;
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
