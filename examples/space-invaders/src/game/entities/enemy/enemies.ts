import { World } from '@dark-star/ecs';

import { AssetStore } from '../../asset-store';

import { Enemy } from './enemy.component';

import { Position } from '../../common/position.component';
import { Velocity } from '../../common/velocity.component';

import { Collider } from '../../collision-detection/collider.component';
import { Movement } from '../../movement/movement.component';

import { ProjectileType, Weapon } from '../../combat/weapon.component';
import { Health } from '../../combat/health.component';

import { Sprite } from '../../rendering/sprite.component';
import { Shapes } from '../../../cd/shapes';
import { getRandomInt } from '../../../utils/misc';

const enemyColours = ['Black', 'Blue', 'Green', 'Red'];

export const enemies = (world: World, assetStore: AssetStore): void => {
    let row = 0;
    let column = 0;

    world.spawn(
        30,
        [Position, Collider, Sprite, Movement, Weapon, Health, Enemy, Velocity],
        (enemyId, [position, collider, sprite, movement, weapon, health, enemy], index) => {
            const modelType = getRandomInt(1, 5);
            const colour = getRandomInt(0, 3);

            sprite.image = `enemy${enemyColours[colour]}${modelType}`;
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
            weapon.direction = { x: 0, y: 1 };
            weapon.fireSound = assetStore.getSound('laser1');
            weapon.offset.x = sprite.width / 2;

            health.maxHealth = 1;
            health.currentHealth = health.maxHealth;

            position.x = column * 90 + sprite.width / 2;
            position.y = 50 + row * 100;

            movement.speed = 100 / 1000;

            enemy.row = row;
            enemy.column = column;

            column++;

            if (column === 10) {
                column = 0;
                row++;
            }
        }
    );
};
