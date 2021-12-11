import { System, system, World, QueryResult, component } from '@dark-star/ecs';

import { Keyboard, Keys } from './inputs/keyboard';
import { Velocity } from './components/velocity';

@component
export class PlayerControlled {}

@system
export class InputSystem implements System {
    private entities: QueryResult<[typeof Velocity, typeof PlayerControlled]>;

    constructor(world: World, private keyboard: Keyboard) {
        this.entities = world.query([Velocity, PlayerControlled]);
    }

    public execute(deltaT: number) {
        const keyboard = this.keyboard;
        let i;

        const up = keyboard.pressed(Keys.W) || keyboard.pressed(Keys.UP);
        const down = keyboard.pressed(Keys.S) || keyboard.pressed(Keys.DOWN);
        const left = keyboard.pressed(Keys.A) || keyboard.pressed(Keys.LEFT);
        const right = keyboard.pressed(Keys.D) || keyboard.pressed(Keys.RIGHT);

        for (const [entities, [velocities]] of this.entities) {
            const count = entities.length;

            for (i = 0; i < count; i++) {
                velocities[i].x = 0;
                velocities[i].y = 0;

                if (up) {
                    velocities[i].y -= 300 / 1000;
                }
                if (down) {
                    velocities[i].y += 300 / 1000;
                }
                if (right) {
                    velocities[i].x += 300 / 1000;
                }
                if (left) {
                    velocities[i].x -= 300 / 1000;
                }
            }
        }
    }
}
