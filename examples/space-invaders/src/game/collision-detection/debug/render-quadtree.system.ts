import { system, System } from '@dark-star/ecs';
import { Quadtree } from '../../../cd/structures/quad-tree';

import { CollisionProvider } from '../collision.provider';

@system
export class RenderQuadtreeSystem extends System {
    private quadtree: Quadtree;

    constructor(private context: CanvasRenderingContext2D, collisionProvider: CollisionProvider) {
        super();
        this.quadtree = collisionProvider.quadtree;
    }

    public execute() {
        const quadtree = this.quadtree;

        this.drawNode(quadtree);
    }

    private drawNode(entryNode: Quadtree): void {
        const context = this.context;

        // draw node bounds
        context.beginPath();
        context.lineWidth = 6;
        context.rect(...entryNode.bounds);
        context.stroke();

        for (const node of entryNode.nodes) {
            this.drawNode(node);
        }
    }
}
