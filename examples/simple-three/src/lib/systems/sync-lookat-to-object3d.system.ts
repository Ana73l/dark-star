import { System, group, SystemQuery, read, entities, updateBefore } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { ThreeObject } from '../components/three-object.data';
import { LookAt } from '../components/look-at.data';

import { RenderGroup } from './render-group.system';
import { RenderThreeScene } from './render-three-scene.system';

@injectable()
@group(RenderGroup)
@updateBefore(RenderThreeScene)
export class SyncLookAtToObject3D extends System {
	@entities([ThreeObject, LookAt])
	public movables!: SystemQuery<[typeof ThreeObject, typeof LookAt]>;

	constructor(private threeSceneSystem: RenderThreeScene) {
		super();
	}

	public override async update() {
		const entityToThreeObj = this.threeSceneSystem.entityToThreeObj;

		await this.movables
			.each([read(ThreeObject), read(LookAt)], ([threeObj, lookAt]) => {
				const obj = entityToThreeObj.get(threeObj.entity)!.object;

				obj.lookAt(lookAt.x, lookAt.y, lookAt.z);
			})
			.run();
	}
}
