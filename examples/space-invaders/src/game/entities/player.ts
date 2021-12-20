import { World } from '@dark-star/ecs';

import { AssetStore } from '../asset-store';

import { Position } from '../common/position.component';
import { Velocity } from '../common/velocity.component';

import { Collider } from '../collision-detection/collider.component';
import { Movement } from '../movement/movement.component';

import { ProjectileType, Weapon } from '../combat/weapon.component';
import { Health } from '../combat/health.component';
import { DamagedSprite } from '../rendering/damaged-sprite.component';

import { Sprite } from '../rendering/sprite.component';
import { PlayerControlled } from '../input-system';
import { Shapes } from '../../cd/shapes';

export const player = (world: World, assetStore: AssetStore): void => {
    world.spawn(
        [Position, Collider, Sprite, Movement, Weapon, Health, DamagedSprite, PlayerControlled, Velocity],
        (playerId, [position, collider, sprite, movement, weapon, health, damagedSprite]) => {
            sprite.image = assetStore.getSprite('playerShip1');
            sprite.width = 70;
            sprite.height = 50;

            collider.shape = {
                type: Shapes.Rectangle,
                width: 70,
                height: 50
            };

            weapon.damage = 10;
            weapon.fireRate = 0.5;
            weapon.projectileSpeed = 1;
            weapon.projectileType = ProjectileType.Laser;
            weapon.projectileSprite = 'laserGreen06';
            weapon.projectileImpactSprite = 'laserGreen01';
            weapon.direction = { x: 0, y: -1 };
            weapon.fireSound = assetStore.getSound('laser1');

            damagedSprite.width = sprite.width;
            damagedSprite.height = sprite.height;
            damagedSprite.percentToSprite[70] = assetStore.getSprite('');

            health.maxHealth = 100;
            health.currentHealth = 100;

            position.x = 300;
            position.y = 200;

            movement.speed = 600 / 1000;
        }
    );
};
