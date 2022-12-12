import { entities, read, System, SystemQuery, updateBefore, World, write } from "@dark-star/ecs";
import { injectable } from "@dark-star/di";

import { Position } from "../../movement/components/position.data";
import { Sprite } from "../../rendering/components/sprite.data";
import { Movement } from "../../movement/components/movement.data";
import { Damage } from "../components/damage.data";
import { Velocity } from "../../movement/components/velocity.data";

import { Weapon } from "../components/weapon.data";
import { Death } from "./death.system";
import { Projectile } from "../components/projectile.data";
import { DeltaTime } from "../../delta-time";

@injectable()
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
                [this.world, this.deltaT.value, Projectile, Sprite, Position, Movement, Damage, Velocity],
                // can safely access world and component classes on a background thread
                (entity, [weapon, position], [world, deltaT, Projectile, Sprite, Position, Movement, Damage, Velocity]) => {
                    weapon.timeSinceLastShot += deltaT;

                    if(weapon.isFiring && weapon.timeSinceLastShot / 1000 >= weapon.fireThrottle) {
                        world.spawn(
                            [Projectile, Sprite, Position, Movement, Damage, Velocity],
                            (_, [projectile, sprite, projectilePosition, movement, damage]) => {
                                projectile.shooter = entity;

                                sprite.image = weapon.projectileSprite;
                                sprite.height = 20;
                                sprite.width = 10;

                                projectilePosition.x = position.x + weapon.offsetX;
                                projectilePosition.y = position.y + weapon.offsetY;

                                movement.speedY = weapon.projectileSpeed;
                                
                                if(weapon.direction === 1) {
                                    movement.down = true;
                                } else if(weapon.direction === -1) {
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