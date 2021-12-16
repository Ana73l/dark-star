import { provider, Entity } from '@dark-star/ecs';
import { Quadtree } from '../../cd/structures/quad-tree';
import { Position } from '../common/position.component';

import { Collider } from './collider.component';

export type CollisionProviderOptions = {
    bounds?: { x: number; y: number; width: number; height: number };
};

@provider
export class CollisionProvider {
    public quadtree: Quadtree;
    public readonly entityColliders: Map<Entity, [Position, Collider]> = new Map();

    constructor(context: CanvasRenderingContext2D) {
        this.quadtree = new Quadtree([0, 0, context.canvas.clientWidth, context.canvas.clientHeight], 0, 10, 5);
    }
}
