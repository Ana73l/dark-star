import { Entity } from '@dark-star/ecs';

type AABB = [x: number, y: number, width: number, height: number];
type EntityAABB = [...box: AABB, entity: Entity];

export type QuadTreeParams = {
    bounds?: AABB;
    maxObjects?: number;
    maxLevels?: number;
    level?: number;
};

export class Quadtree {
    private entities: EntityAABB[] = [];
    public readonly nodes: [Quadtree, Quadtree, Quadtree, Quadtree] | [] = [];

    constructor(
        public readonly bounds: AABB = [0, 0, 0, 0],
        private level: number = 0,
        private maxObjects: number = 10,
        private maxLevels: number = 5
    ) {}

    public insert(entity: EntityAABB): void {
        if (this.nodes.length) {
            const quadrant = this.getQuadrant(entity);

            // add to subnote if box fits entirely
            if (quadrant !== -1) {
                this.nodes[quadrant].insert(entity);
                return;
            }
        }
        this.entities.push(entity);
        // prevent infinite splitting
        if (this.entities.length > this.maxObjects && this.level < this.maxLevels) {
            if (this.nodes.length === 0) {
                this.split();
            }
            let currentBoxIndex = 0;
            while (currentBoxIndex < this.entities.length) {
                const quadrant = this.getQuadrant(this.entities[currentBoxIndex]);
                if (quadrant !== -1) {
                    this.nodes[quadrant].insert(this.entities.splice(currentBoxIndex, 1)[0]);
                } else {
                    currentBoxIndex++;
                }
            }
        }
    }

    public getAll(result: EntityAABB[] = []): EntityAABB[] {
        for (const node of this.nodes) {
            node.getAll(result);
        }
        for (const entity of this.entities) {
            result.push(entity);
        }

        return result;
    }

    public getPossibleCollisions(entity: EntityAABB, result: Entity[] = []): Entity[] {
        const quadrant = this.getQuadrant(entity);
        if (quadrant !== -1 && this.nodes.length) {
            this.nodes[quadrant].getPossibleCollisions(entity, result);
        }
        for (const e of this.entities) {
            result.push(e[4]);
        }
        return result;
    }

    public clear(): void {
        this.entities = [];
        for (const node of this.nodes) {
            node.clear();
        }
        while (this.nodes.length > 0) {
            this.nodes.pop();
        }
    }

    private getQuadrant(box: EntityAABB): number {
        const verticalMidpoint = this.bounds[0] + this.bounds[2] / 2;
        const horizontalMidpoint = this.bounds[1] + this.bounds[3] / 2;
        // fits entirely in top quadrant
        const topQuadrant = box[1] < horizontalMidpoint && box[1] + box[3] < horizontalMidpoint;
        // fits entirely in bottom quadrant
        const bottomQuadrant = box[1] > horizontalMidpoint;
        // fits entirely in left quadratans
        if (box[0] < verticalMidpoint && box[0] + box[2] < verticalMidpoint) {
            if (topQuadrant) {
                return 1;
            } else if (bottomQuadrant) {
                return 2;
            }
        }
        // fits entirely in right quadratans
        else if (box[0] > verticalMidpoint) {
            if (topQuadrant) {
                return 0;
            } else if (bottomQuadrant) {
                return 3;
            }
        }

        // doesn't fit entirely in any quadrants
        return -1;
    }

    private split(): void {
        const subWidth = (this.bounds[2] / 2) | 0;
        const subHeight = (this.bounds[3] / 2) | 0;

        this.nodes[0] = new Quadtree(
            [this.bounds[0] + subWidth, this.bounds[1], subWidth, subHeight],
            this.level + 1,
            this.maxObjects,
            this.maxLevels
        );
        this.nodes[1] = new Quadtree(
            [this.bounds[0], this.bounds[1], subWidth, subHeight],
            this.level + 1,
            this.maxObjects,
            this.maxLevels
        );
        this.nodes[2] = new Quadtree(
            [this.bounds[0], this.bounds[1] + subHeight, subWidth, subHeight],
            this.level + 1,
            this.maxObjects,
            this.maxLevels
        );
        this.nodes[3] = new Quadtree(
            [this.bounds[0] + subWidth, this.bounds[1] + subHeight, subWidth, subHeight],
            this.level + 1,
            this.maxObjects,
            this.maxLevels
        );
    }
}
