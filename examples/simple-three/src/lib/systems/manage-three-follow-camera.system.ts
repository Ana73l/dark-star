import { System, group, SystemQuery, read, entities, World } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';
import { Scene, PerspectiveCamera, WebGLRenderer, Camera } from 'three';

import { ThreeObject } from '../components/three-object.data';

import { RenderGroup } from './render-group.system';
import { FollowCamera } from '../components/follow-camera.data';
import { RenderThreeScene } from './render-three-scene.system';
import { Model } from '../components/model.data';

@injectable()
@group(RenderGroup)
export class ManageThreeFollowCamera extends System {
	@entities([FollowCamera], [], [ThreeObject])
	public newCameras!: SystemQuery<[typeof FollowCamera], [], [typeof ThreeObject]>;

	@entities([FollowCamera, ThreeObject])
	public activeCameras!: SystemQuery<[typeof FollowCamera, typeof ThreeObject]>;

	@entities([ThreeObject], [], [FollowCamera, Model])
	public flaggedForDestruction!: SystemQuery<[typeof ThreeObject], [], [typeof FollowCamera, typeof Model]>;

	constructor(private world: World, private scene: Scene, private threeSceneSystem: RenderThreeScene, private renderer: WebGLRenderer) {
		super();
	}

	public override async update() {
		const entityToThreeObj = this.threeSceneSystem.entityToThreeObj;

		await this.newCameras
			.withEntities()
			.each([read(FollowCamera)], (entity) => {
				const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 1000);

				this.scene.add(camera);
				entityToThreeObj.set(entity, { object: camera });

				this.world.attach(entity, [ThreeObject], ([threeObj]) => {
					threeObj.entity = entity;
				});
			})
			.run();

		await this.activeCameras
			.each([read(ThreeObject)], ([threeObj]) => {
				const camera = entityToThreeObj.get(threeObj.entity)!.object as Camera;

				if (camera) {
					this.renderer.render(this.scene, camera);
				}
			})
			.run();

		await this.flaggedForDestruction
			.each([read(ThreeObject)], ([threeObj]) => {
				const obj = entityToThreeObj.get(threeObj.entity);

				if (obj) {
					this.scene.remove(obj.object);
					entityToThreeObj.delete(threeObj.entity);
				}

				this.world.detach(threeObj.entity, [ThreeObject]);
			})
			.run();
	}
}
