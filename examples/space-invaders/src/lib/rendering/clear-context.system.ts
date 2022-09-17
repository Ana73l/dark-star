import { System } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

@injectable()
export class ClearContextSystem extends System {
	constructor(private context: CanvasRenderingContext2D) {
		super();
	}

	public override async update(): Promise<void> {
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
	}
}
