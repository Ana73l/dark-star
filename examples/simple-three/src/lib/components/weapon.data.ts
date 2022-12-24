import { component } from '@dark-star/ecs';
import { float64, int8, uint8, string16, bool } from '@dark-star/shared-object';

@component()
export class Weapon {
    @float64()
    fireThrottle: number = 0;

    @float64()
    timeSinceLastShot: number = 0;

    @bool()
    isFiring: boolean = false;

    @uint8()
    damage: number = 0;

    @string16(30)
    projectileSprite: string = '';

    @uint8()
    projectileSpeed: number = 0;

    @int8()
    direction: number = 0;

    @uint8()
    offsetX: number = 0;

    @uint8()
    offsetY: number = 0;
}