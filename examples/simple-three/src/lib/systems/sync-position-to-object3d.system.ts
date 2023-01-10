import { System, group, SystemQuery, read, entities, updateBefore } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { ThreeObject } from '../components/three-object';

import { RenderGroup } from './render-group.system';
import { Position } from '../components/position.data';
import { RenderThreeScene } from './render-three-scene';

@injectable()
@group(RenderGroup)
@updateBefore(RenderThreeScene)
export class SyncPositionToObject3D extends System {
	@entities([ThreeObject, Position])
	public movables!: SystemQuery<[typeof ThreeObject, typeof Position]>;

	constructor(private threeSceneSystem: RenderThreeScene) {
		super();
	}

	public override async update() {
		const entityToThreeObj = this.threeSceneSystem.entityToThreeObj;

		await this.movables
			.each([read(ThreeObject), read(Position)], ([threeObj, position]) => {
				const obj = entityToThreeObj.get(threeObj.entity)!;

				obj.position.set(position.x, position.y, position.z);
			})
			.run();
	}
}
