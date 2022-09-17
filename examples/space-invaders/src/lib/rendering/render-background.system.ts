import { System, read, Query } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Background } from './background.data';
import { Sprite } from './sprite.data';

@injectable()
export class RenderBackgroundSystem extends System {
	private entities!: Query<[typeof Background]>;

	constructor(private context: CanvasRenderingContext2D) {
		super();
	}

	public override init(): void {
		this.entities = this.query([Background]);
	}

	public override async update(): Promise<void> {
		const width = this.context.canvas.clientHeight;
		const height = this.context.canvas.clientHeight;

		/**
		 * Run this action on the main thread since we are accessing main thread data & APIs
		 */
		await this.entities
			.each([read(Background), Sprite], ([background, sprite]) => {
				// this.context.drawImage('/public/sth.png', 0, 0, width, height);
			})
			.run();
	}
}
