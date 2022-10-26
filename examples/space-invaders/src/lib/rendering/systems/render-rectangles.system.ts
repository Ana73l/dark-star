import { System, group, Query, read, updateAfter, entities } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';
import { RenderGroupSystem } from './render-group.system';
import { Rectangle } from '../components/rectangle.data';
import { Position } from '../../movement/components/position.data';
import { ClearContextSystem } from './clear-context.system';

@injectable()
@group(RenderGroupSystem)
@updateAfter(ClearContextSystem)
export class RenderRectanglesSystem extends System {
	@entities([Position, Rectangle])
	public entities!: Query<[typeof Position, typeof Rectangle]>;

	constructor(private context: CanvasRenderingContext2D) {
		super();
	}

	public override async update(): Promise<void> {
		const context = this.context;
		/**
		 * Run this action on the main thread since we are accessing main thread APIs
		 */
		await this.entities
			.each([read(Position), read(Rectangle)], ([position, rect]) => {
				context.beginPath();
				context.rect(position.x, position.y, rect.width, rect.height);
				context.stroke();
			})
			.run();
	}
}
