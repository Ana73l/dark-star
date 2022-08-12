import { System, system } from '@dark-star/ecs';

@system
export class ClearContextSystem extends System {
    constructor(private context: CanvasRenderingContext2D) {
        super();
    }

    public execute() {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    }
}
