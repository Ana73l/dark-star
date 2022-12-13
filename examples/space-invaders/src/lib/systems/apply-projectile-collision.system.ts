import { injectable } from '@dark-star/di';
import { ComponentLookup, entities, read, System, SystemQuery, updateAfter, updateBefore, World, group } from '@dark-star/ecs';

import { Collider } from '../components/collider.data';
import { ClearColisions } from './clear-collisions';
import { DetectCollisions } from './detect-collisions.system';

import { Damage } from '../components/damage.data';
import { Health } from '../components/health.data';
import { Projectile } from '../components/projectile.data';
import { SimulationGroup } from './simulation-group.system';

@injectable()
@group(SimulationGroup)
@updateAfter(DetectCollisions)
@updateBefore(ClearColisions)
export class ApplyProjectileCollision extends System {
	@entities([Projectile, Collider, Damage])
	public projectiles!: SystemQuery<[typeof Projectile, typeof Collider, typeof Damage]>;

	private entitiesWithHealth!: ComponentLookup<typeof Health>;

	constructor(private world: World) {
		super();
	}

	public override async init() {
		this.entitiesWithHealth = this.getComponentLookup(Health);
	}

	public override async update() {
		this.projectiles
			.withEntities()
			.each(
				[read(Projectile), read(Collider), read(Damage)],
				[this.world, this.entitiesWithHealth],
				(entity, [projectile, collider, damage], [world, entitiesWithHealth]) => {
					// projectile has collided with entity different than shooter
					if (collider.collidesWith !== 0 && collider.collidesWith !== projectile.shooter) {
						const targetHealth = entitiesWithHealth[collider.collidesWith];

						// target has health
						if (targetHealth) {
							targetHealth.currentHealth -= damage.value;
						}

						world.destroy(entity);
					}
				}
			)
			.schedule();
	}
}
