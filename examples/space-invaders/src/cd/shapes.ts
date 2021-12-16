import { Vector2 } from './math/vector2';

export enum Shapes {
    Point,
    Line,
    Circle,
    Rectangle,
    Polygon
}

export interface Point extends Vector2 {}

export interface TypedPoint extends Point {
    type: Shapes.Point;
}

export interface Line {
    a: Vector2;
    b: Vector2;
}

export interface TypedLine extends Line {
    type: Shapes.Line;
}

export interface Circle {
    radius: number;
}

export interface TypedCircle extends Circle {
    type: Shapes.Circle;
}

export interface Rectangle {
    height: number;
    width: number;
}

export interface TypedRectangle extends Rectangle {
    type: Shapes.Rectangle;
}

export interface Polygon {
    vertices: Point[];
}

export interface TypedPolygon extends Polygon {
    type: Shapes.Polygon;
}

export type TypedShape = TypedPoint | TypedCircle | TypedRectangle | TypedPolygon;
