import { System, read, SystemQuery } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Background } from '../components/background.data';

@injectable()
export class RenderBackgroundSystem extends System {
	private entities!: SystemQuery<[typeof Background]>;

	constructor(private context: CanvasRenderingContext2D) {
		super();
	}

	public override async init() {
		this.entities = this.query([Background]);
	}

	public override async update() {
		const width = this.context.canvas.clientHeight;
		const height = this.context.canvas.clientHeight;

		/**
		 * Run this action on the main thread since we are accessing main thread data & APIs
		 */
		await this.entities
			.each([read(Background)], ([background]) => {
				// this.context.drawImage('/public/sth.png', 0, 0, width, height);
			})
			.run();
	}
}
