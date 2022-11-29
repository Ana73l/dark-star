import { read, SystemGroup } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Position } from '../../movement/components/position.data';
import { Sprite } from '../components/sprite.data';

@injectable()
export class RenderGroupSystem extends SystemGroup {
	public override async update() {
		// complete all jobs using rendering data before rendering phase begins
		await this.completeJobs([read(Sprite), read(Position)]);
	}
}
