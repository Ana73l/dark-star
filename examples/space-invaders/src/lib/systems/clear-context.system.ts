import { group, System } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { RenderGroup } from './render-group.system';

@injectable()
@group(RenderGroup)
export class ClearContext extends System {
	constructor(private context: CanvasRenderingContext2D) {
		super();
	}

	public override async update() {
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
	}
}
