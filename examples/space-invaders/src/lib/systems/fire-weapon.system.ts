import { entities, group, read, System, SystemQuery, updateBefore, World, write } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { DeltaTime } from '../providers/delta-time.provider';

import { Position } from '../components/position.data';
import { Sprite } from '../components/sprite.data';
import { Movement } from '../components/movement.data';
import { Damage } from '../components/damage.data';
import { Velocity } from '../components/velocity.data';
import { Collider } from '../components/collider.data';
import { Projectile } from '../components/projectile.data';
import { Weapon } from '../components/weapon.data';

import { Death } from './death.system';
import { SimulationGroup } from './simulation-group.system';

@injectable()
@group(SimulationGroup)
@updateBefore(Death)
export class FireWeapon extends System {
	@entities([Weapon, Position])
	public withWeapons!: SystemQuery<[typeof Weapon, typeof Position]>;

	constructor(private world: World, private deltaT: DeltaTime) {
		super();
	}

	public override async update() {
		this.withWeapons
			.withEntities()
			.each(
				[write(Weapon), read(Position)],
				// passing world and component classes since spawning happens on a background thread
				[this.world, this.deltaT.value, Projectile, Sprite, Position, Movement, Damage, Collider, Velocity],
				// can safely access world and component classes on a background thread
				(entity, [weapon, position], [world, deltaT, Projectile, Sprite, Position, Movement, Damage, Collider, Velocity]) => {
					weapon.timeSinceLastShot += deltaT;

					if (weapon.isFiring && weapon.timeSinceLastShot / 1000 >= weapon.fireThrottle) {
						world.spawn(
							[Projectile, Sprite, Position, Movement, Damage, Collider, Velocity],
							(_, [projectile, sprite, projectilePosition, movement, damage, collider]) => {
								projectile.shooter = entity;

								sprite.image = weapon.projectileSprite;
								sprite.height = 20;
								sprite.width = 10;

								collider.height = sprite.height;
								collider.width = sprite.width;

								projectilePosition.x = position.x + weapon.offsetX;
								projectilePosition.y = position.y + weapon.offsetY;

								movement.speedY = weapon.projectileSpeed;

								if (weapon.direction === 1) {
									movement.down = true;
								} else if (weapon.direction === -1) {
									movement.up = true;
								}

								damage.value = weapon.damage;
							}
						);

						weapon.timeSinceLastShot = 0;
					}
				}
			)
			.scheduleParallel();
	}
}
