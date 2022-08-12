import { Entity, QueryResult, System, system, World } from '@dark-star/ecs';

import { Enemy } from './enemy.component';
import { Weapon } from '../../combat/weapon.component';
import { getRandomInt } from '../../../utils/misc';

@system
export class EnemyCombatSystem extends System {
    private entities: QueryResult<[typeof Weapon, typeof Enemy]>;
    private frontLineEnemies: Map<number, [Enemy, Weapon]> = new Map();

    constructor(world: World) {
        super();

        this.entities = world.query([Weapon, Enemy]);
    }

    public execute() {
        const frontLine = this.frontLineEnemies;
        frontLine.clear();

        for (const [entities, [weapons, enemies]] of this.entities) {
            const entityCount = entities.length;

            for (let i = 0; i < entityCount; i++) {
                const weapon = weapons[i];
                const enemy = enemies[i];

                // @ts-ignore
                if (!frontLine.has(enemy.column) || frontLine.get(enemy.column)[0].row < enemy.row) {
                    frontLine.set(enemy.column, [enemy, weapon]);
                }
            }
        }

        for (const [, [, weapon]] of frontLine) {
            // random chance to be firing
            weapon.firing = getRandomInt(1, 50000) >= 49950;
        }
    }
}
