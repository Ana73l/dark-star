import { component } from '@dark-star/ecs';

export enum Shapes {
    Circle,
    Rectangle
}

@component
export class Shape {
    public shape: Shapes = Shapes.Rectangle;
    public width?: number = 5;
    public height?: number = 5;
    public radius?: number = 5;
    public color: string = 'red';
}
