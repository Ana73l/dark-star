import { read, SystemGroup, updateAfter } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Position } from '../components/position.data';
import { Sprite } from '../components/sprite.data';
import { SimulationGroup } from './simulation-group.system';

@injectable()
@updateAfter(SimulationGroup)
export class RenderGroup extends SystemGroup {
	public override async update() {
		// complete all jobs using rendering data before rendering phase begins
		await this.completeJobs([read(Sprite), read(Position)]);
	}
}
