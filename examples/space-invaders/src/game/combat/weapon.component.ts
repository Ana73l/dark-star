import { component } from '@dark-star/ecs';

import { Vector2 } from '../../cd/math/vector2';

export enum ProjectileType {
    Laser
}

@component
export class Weapon {
    fireRate: number = 0;
    timeSinceLastShot: number = 0;
    firing: boolean = false;
    damage: number = 0;
    // @ts-ignore
    projectileType: ProjectileType;
    // @ts-ignore
    projectileSprite: string;
    // @ts-ignore
    projectileImpactSprite: string;
    projectileSpeed: number = 0;
    direction: Vector2 = { x: 0, y: 0 };
    // @ts-ignore
    fireSound: HTMLAudioElement;
}
