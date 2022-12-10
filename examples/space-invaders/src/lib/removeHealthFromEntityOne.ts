import { System, SystemQuery, read, entities, World } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';
import { Health } from './combat/components/health.data';


@injectable()
export class RemoveHealthFromEntityOne extends System {
	@entities([Health])
	public entities!: SystemQuery<[typeof Health]>;

	constructor(private world: World) {
		super();
	}

	public override async update() {
		await this.entities
            .withEntities()
			.each([read(Health)], (entity, [health]) => {
				entity === 1 && this.world.detach(entity, [Health])
			})
			.run();
	}
}
