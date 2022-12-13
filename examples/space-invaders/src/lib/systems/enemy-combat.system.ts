import { System, entities, SystemQuery, write, group } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Enemy } from '../components/enemy.data';
import { Weapon } from '../components/weapon.data';
import { getRandomInt } from '../utils/misc';
import { InputGroup } from './input-group.system';

@injectable()
@group(InputGroup)
export class EnemyCombatSystem extends System {
	@entities([Weapon, Enemy])
	public entities!: SystemQuery<[typeof Weapon, typeof Enemy]>;

	public override async update() {
		this.entities
			.each([write(Weapon)], [getRandomInt.toString()], ([weapon], [getRandomIntString]) => {
				const getRandomInt = eval(getRandomIntString);

				weapon.isFiring = getRandomInt(1, 50000) >= 49950;
			})
			.schedule();
	}
}
