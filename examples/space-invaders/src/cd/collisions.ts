import { Vector2, equal, distance } from './math/vector2';
import { Point, Line, Rectangle, Polygon, TypedShape, Shapes } from './shapes';

const getCircleCenter = (position: Vector2, radius: number): Vector2 => ({
    x: position.x + radius,
    y: position.y + radius
});

export const pointToPoint = (a: Point, b: Point): boolean => equal(a, b);

export const pointToLine = (point: Point, line: Line): boolean => {
    // distance from point to both ends of the line
    const distanceA = distance(point, line.a);
    const distanceB = distance(point, line.b);

    const lineLength = distance(line.a, line.b);

    const buffer = 0.1;

    return distanceA + distanceB >= lineLength - buffer && distanceA + distanceB <= lineLength - buffer;
};

export const pointToRectangle = (point: Point, rectanglePosition: Vector2, rectangle: Rectangle): boolean =>
    point.x >= rectanglePosition.x &&
    point.x <= rectanglePosition.x + rectangle.width &&
    point.y >= rectanglePosition.y &&
    point.y <= rectanglePosition.y + rectangle.height;

export const pointToCircle = (point: Point, circlePosition: Vector2, circleRadius: number): boolean =>
    distance(point, getCircleCenter(circlePosition, circleRadius)) <= circleRadius;

export const pointToPolygon = (point: Point, polygon: Polygon): boolean => {
    let collision = false;

    // iterate vertices
    const vertices = polygon.vertices;
    const verticesCount = vertices.length;
    let currentIndex = 0;
    let nextIndex: number;

    for (currentIndex = 0; currentIndex < verticesCount; currentIndex++) {
        nextIndex = currentIndex + 1;

        // reached whole polygon, wrap to first vertex
        if (nextIndex === verticesCount) {
            nextIndex = 0;
        }

        const current = vertices[currentIndex];
        const next = vertices[nextIndex];

        // compare position, flip the collision variable
        if (
            ((current.y >= point.y && next.y < point.y) || (current.y < point.y && next.y >= point.y)) &&
            point.x < ((next.x - current.x) * (point.y - current.y)) / (next.y - current.y) + current.x
        ) {
            collision = !collision;
        }
    }

    return collision;
};

export const lineToLine = (lineA: Line, lineB: Line): boolean => {
    // distance to intersection point
    const uA =
        ((lineB.b.x - lineB.a.x) * (lineA.a.y - lineB.a.y) - (lineB.b.y - lineB.a.y) * (lineA.a.x - lineB.a.x)) /
        ((lineB.b.y - lineB.a.y) * (lineA.b.x - lineA.a.x) - (lineB.b.x - lineB.a.x) * (lineA.b.y - lineA.a.y));
    const uB =
        ((lineA.b.x - lineA.a.x) * (lineA.a.y - lineB.a.y) - (lineA.b.y - lineA.a.y) * (lineA.a.x - lineB.a.x)) /
        ((lineB.b.y - lineB.a.y) * (lineA.b.x - lineA.a.x) - (lineB.b.x - lineB.a.x) * (lineA.b.y - lineA.a.y));

    // if both uA and uB are between 0-1 - line intersect
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 0) {
        return true;
    }

    return false;
};

export const rectangleToRectangle = (
    positionA: Vector2,
    rectA: Rectangle,
    positionB: Vector2,
    rectB: Rectangle
): boolean =>
    positionA.x + rectA.width >= positionB.x &&
    positionA.x <= positionB.x + rectB.width &&
    positionA.y + rectA.height >= positionB.y &&
    positionA.y <= positionB.y + rectB.height;

export const rectangleToCircle = (
    rectanglePosition: Vector2,
    rectangle: Rectangle,
    circlePosition: Vector2,
    circleRadius: number
): boolean => {
    const center = getCircleCenter(circlePosition, circleRadius);
    // test closest edge (point) to circle center
    let x = center.x;
    let y = center.y;

    if (center.x < rectanglePosition.x) {
        x = rectanglePosition.x; // left edge
    } else if (center.x > rectanglePosition.x + rectangle.width) {
        x = rectanglePosition.x + rectangle.width; // right edge
    }
    if (center.y < rectanglePosition.y) {
        y = rectanglePosition.y; // top edge
    } else if (center.y > rectanglePosition.y + rectangle.height) {
        y = rectanglePosition.y + rectangle.height; // bottom edge
    }

    return pointToCircle({ x, y }, circlePosition, circleRadius);
};

export const circleToCircle = (positionA: Vector2, radiusA: number, positionB: Vector2, radiusB: number): boolean => {
    return distance(getCircleCenter(positionA, radiusA), getCircleCenter(positionB, radiusB)) <= radiusA + radiusB;
};

export const shapesCollide = (a: TypedShape, b: TypedShape, positionA: Vector2, positionB: Vector2): boolean => {
    switch (a.type) {
        case Shapes.Rectangle:
            switch (b.type) {
                case Shapes.Rectangle:
                    return rectangleToRectangle(positionA, a, positionB, b);
                case Shapes.Circle:
                    return rectangleToCircle(positionA, a, positionB, b.radius);
            }
            break;
        case Shapes.Circle:
            switch (b.type) {
                case Shapes.Rectangle:
                    return rectangleToCircle(positionB, b, positionA, a.radius);
                case Shapes.Circle:
                    return circleToCircle(positionA, a.radius, positionB, b.radius);
            }
    }
    return false;
};
