import { group, read, System } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';
import { RenderGroupSystem } from './render-group.system';
import { Sprite } from '../components/sprite.data';
import { Position } from '../../movement/components/position.data';

@injectable()
@group(RenderGroupSystem)
export class ClearContextSystem extends System {
	constructor(private context: CanvasRenderingContext2D) {
		super();
	}

	public override async update(): Promise<void> {
		await this.completeJobs([read(Sprite), read(Position)]);
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
	}
}
