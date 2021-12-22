import { QueryResult, System, system, World } from '@dark-star/ecs';

import { Enemy } from './enemy.component';
import { Weapon } from '../../combat/weapon.component';
import { getRandomInt } from '../../../utils/misc';

@system
export class EnemyCombatSystem extends System {
    private entities: QueryResult<[typeof Weapon, typeof Enemy]>;

    constructor(world: World) {
        super();

        this.entities = world.query([Weapon, Enemy]);
    }

    public execute() {
        for (const [entities, [weapons]] of this.entities) {
            const entityCount = entities.length;

            for (let i = 0; i < entityCount; i++) {
                const weapon = weapons[i];

                // random chance to be firing
                weapon.firing = getRandomInt(1, 10000) >= 9950;
            }
        }
    }
}
