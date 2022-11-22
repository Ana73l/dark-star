import { System, entities, SystemQuery } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Enemy } from '../components/enemy.data';

@injectable()
export class EnemyCombatSystem extends System {
	@entities([Enemy])
	public entities!: SystemQuery<[typeof Enemy]>;

	public override async update(): Promise<void> {}
}
