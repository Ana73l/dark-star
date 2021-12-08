import { System, World } from '@dark-star/ecs';
export declare class RenderSystem extends System {
    private context;
    private entities;
    constructor(world: World, context: CanvasRenderingContext2D);
    execute(deltaT: number): void;
}
//# sourceMappingURL=render-system.d.ts.map