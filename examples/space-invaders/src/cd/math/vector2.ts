export type Vector2 = {
    x: number;
    y: number;
};

export const addInPlace = (a: Vector2, b: Vector2): Vector2 => {
    a.x += b.x;
    a.y += b.y;

    return a;
};

export const subtractInPlace = (a: Vector2, b: Vector2): Vector2 => {
    a.x -= b.x;
    a.y -= b.y;

    return a;
};

export const equal = (a: Vector2, b: Vector2): boolean => a.x === b.x && a.y === b.y;

export const distance = (a: Vector2, b: Vector2): number =>
    Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));

export const add = (a: Vector2, b: Vector2): Vector2 => ({
    x: a.x + b.x,
    y: a.y + b.y
});

export const subtract = (a: Vector2, b: Vector2): Vector2 => ({
    x: a.x - b.x,
    y: a.y - b.y
});
