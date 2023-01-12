import { System, group, SystemQuery, read, entities, Entity, World } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';
import { WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, Object3D } from 'three';

import { Position } from '../components/position.data';
import { Model } from '../components/model.data';
import { ThreeObject } from '../components/three-object.data';
import { AssetStore, Model3D } from '../asset-store';

import { RenderGroup } from './render-group.system';
import { FollowCamera } from '../components/follow-camera.data';

@injectable()
@group(RenderGroup)
export class RenderThreeScene extends System {
	@entities([Model], [], [ThreeObject])
	public newRenderables!: SystemQuery<[typeof Model], [], [typeof ThreeObject]>;

	@entities([ThreeObject], [], [Model, FollowCamera])
	public flaggedForDestruction!: SystemQuery<[typeof ThreeObject], [], [typeof Model, typeof FollowCamera]>;

	public entityToThreeObj: Map<Entity, Model3D> = new Map();

	constructor(private world: World, private assetStore: AssetStore, private renderer: WebGLRenderer, private scene: Scene) {
		super();
	}

	public override async init() {
		const light = new HemisphereLight(0xffffbb, 0x080820, 1);
		this.scene.add(light);

		this.world.spawn([Position, Model], (_, [position, model]) => {
			model.scale = 5;
			model.model = 'Tower';

			position.x = 80;
		});

		this.world.spawn([Position, Model], (_, [position, model]) => {
			model.scale = 0.01;
			model.model = 'archerTowerLvl1';

			position.x = -20;
		});

		window.addEventListener('resize', this.onResize);
	}

	public override async update() {
		await this.newRenderables
			.withEntities()
			.each([read(Model)], (entity, [model]) => {
				const model3 = this.assetStore.getObject(model.model);
				model3.object.scale.setScalar(model.scale);
				this.scene.add(model3.object);
				this.entityToThreeObj.set(entity, model3);

				this.world.attach(entity, [ThreeObject], ([threeObj]) => {
					threeObj.entity = entity;
				});
			})
			.run();

		await this.flaggedForDestruction
			.each([read(ThreeObject)], ([threeObj]) => {
				const obj = this.entityToThreeObj.get(threeObj.entity);

				if (obj) {
					this.scene.remove(obj.object);
					this.entityToThreeObj.delete(threeObj.entity);
				}

				this.world.detach(threeObj.entity, [ThreeObject]);
			})
			.run();
	}

	public override async destroy() {
		window.removeEventListener('resize', this.onResize);
	}

	private onResize = () => {
		for (const o of this.entityToThreeObj.values()) {
			if (o instanceof PerspectiveCamera) {
				o.aspect = window.innerWidth / window.innerHeight;
				o.updateProjectionMatrix();
			}
		}
		// this.camera.aspect = window.innerWidth / window.innerHeight;
		// this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	};
}
