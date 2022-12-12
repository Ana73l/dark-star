import { entities, System, SystemQuery, read, write, updateAfter, updateBefore, World } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Position } from '../../movement/components/position.data';
import { Movement } from '../../movement/components/movement.data';

import { Enemy } from '../components/enemy.data';
import { ClearVelocity } from '../../movement/systems/clear-velocity.system';
import { PrepareMovement } from '../../movement/systems/prepare-movement.system';
import { Sprite } from '../../rendering/components/sprite.data';
import { Velocity } from '../../movement/components/velocity.data';
import { Weapon } from '../../combat/components/weapon.data';
import { Health } from '../../combat/components/health.data';

import { getRandomInt } from '../../utils/misc';

@injectable()
@updateAfter(ClearVelocity)
@updateBefore(PrepareMovement)
export class EnemyMovement extends System {
	@entities([Position, Movement, Enemy])
	public enemies!: SystemQuery<[typeof Position, typeof Movement, typeof Enemy]>;
    
    constructor(private world: World) { super(); }

    public override async init() {
        await this.jobWithCode([this.world, getRandomInt.toString(), Position, Sprite, Movement, Enemy, Weapon, Health, Velocity], ([world, getRandomIntString, Position, Sprite, Movement, Enemy, Weapon, Health, Velocity]) => {
            const getRandomInt = eval(getRandomIntString);
            
            const enemyColors = ['Black', 'Blue', 'Green', 'Red'];
            let row = 0;
            let column = 0;

            for(let i = 0; i < 30; i++) {
                world.spawn([Position, Movement, Sprite, Enemy, Weapon, Health, Velocity], (_, [position, movement, sprite, enemy, weapon, health]) => {
                    const modelType = getRandomInt(1, 5);
                    const color = getRandomInt(0, 3);

                    sprite.image = `enemy${enemyColors[color]}${modelType}`;
                    sprite.width = 70;
                    sprite.height = 50;

                    movement.speedX = 100 / 1000;
                    movement.speedY = 500 / 1000;
                    
                    enemy.row = row;
                    enemy.column = column;

                    position.x = column * 90 + sprite.width / 2;
                    position.y = -120 + row * 100;

                    weapon.damage = 10;
                    weapon.fireThrottle = 0.5;
                    weapon.projectileSpeed = 1;
                    weapon.projectileSprite = 'laserRed06';
                    weapon.direction = 1;
                    weapon.offsetX = sprite.width / 2;

                    health.maxHealth = 1;
                    health.currentHealth = 1;

                    column++;

                    if(column === 10) {
                        column = 0;
                        row++;
                    }
                })
            }
        })
        .schedule()
        .complete();
    }

	public override async update() {
		// horizontal borders of enemy rectangle
		let minX = Number.MAX_VALUE;
		let maxX = Number.MIN_VALUE;

		await this.enemies
			.each([read(Position)], ([position]) => {
				if (position.x > maxX) {
					maxX = position.x;
				}
				if (position.x < minX) {
					minX = position.x;
				}
			})
			.run();

		const direction = minX <= 35 ? 1 : maxX >= 1420 ? -1 : 0;

		this.enemies
			.each([write(Movement)], [direction], ([movement], [direction]) => {
				if (direction === -1) {
					movement.right = false;
					movement.left = true;
					movement.down = true;
				} else if (direction === 1) {
					movement.right = true;
					movement.left = false;
					movement.down = true;
				} else {
					movement.down = false;
				}
			})
			.schedule();
	}
}
