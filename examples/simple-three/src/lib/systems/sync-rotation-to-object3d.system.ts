import { System, group, SystemQuery, read, entities, updateBefore } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { ThreeObject } from '../components/three-object.data';

import { RenderGroup } from './render-group.system';
import { Rotation } from '../components/rotation.data';
import { RenderThreeScene } from './render-three-scene.system';

@injectable()
@group(RenderGroup)
@updateBefore(RenderThreeScene)
export class SyncRotationToObject3D extends System {
	@entities([ThreeObject, Rotation])
	public rotatables!: SystemQuery<[typeof ThreeObject, typeof Rotation]>;

	constructor(private threeSceneSystem: RenderThreeScene) {
		super();
	}

	public override async update() {
		const entityToThreeObj = this.threeSceneSystem.entityToThreeObj;

		await this.rotatables
			.each([read(ThreeObject), read(Rotation)], ([threeObj, rotation]) => {
				const obj = entityToThreeObj.get(threeObj.entity)!.object;

				obj.rotation.set(rotation.x, rotation.y, rotation.z);
			})
			.run();
	}
}
