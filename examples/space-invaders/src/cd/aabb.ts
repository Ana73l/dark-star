import { Vector2 } from './math/vector2';
import { Shapes, TypedShape, Rectangle, Circle, Point, Polygon } from './shapes';

export type AABB = [x: number, y: number, width: number, height: number];

const rectAABB = (rectangle: Rectangle, position: Vector2): AABB => [
    position.x,
    position.y,
    rectangle.width,
    rectangle.height
];
const pointAABB = (point: Point): AABB => [point.x, point.y, 0, 0];
const circleAABB = (circle: Circle, position: Vector2): AABB => [
    position.x,
    position.y,
    circle.radius * 2,
    circle.radius * 2
];
const polygonAABB = (polygon: Polygon): AABB => {
    let minX = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let minY = minX;
    let maxY = maxX;

    for (const point of polygon.vertices) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
    }

    const width = maxX - minX;
    const height = maxY - minY;

    return [maxX, maxY, width, height];
};

export const shapeAABB = <T extends TypedShape>(shape: T, position: Vector2): AABB => {
    switch (shape.type) {
        case Shapes.Rectangle:
            return rectAABB(shape, position);
        case Shapes.Point:
            return pointAABB(shape);
        case Shapes.Circle:
            return circleAABB(shape, position);
        case Shapes.Polygon:
            return polygonAABB(shape);
    }
};
