import { System, group, SystemQuery, read, updateAfter, entities, Entity, World } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';
import { WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, Object3D } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { Position } from '../components/position.data';
import { Model3 } from '../components/model3.data';
import { ThreeObject } from '../components/three-object';
import { AssetStore } from '../asset-store';

import { RenderGroup } from './render-group.system';

@injectable()
@group(RenderGroup)
export class RenderThreeScene extends System {
	@entities([Model3], [], [ThreeObject])
	public newRenderables!: SystemQuery<[typeof Model3], [], [typeof ThreeObject]>;

	@entities([ThreeObject, Position])
	public activeRenderables!: SystemQuery<[typeof ThreeObject, typeof Position]>;

	@entities([ThreeObject], [], [Model3])
	public flaggedForDestruction!: SystemQuery<[typeof ThreeObject], [], [typeof Model3]>;

	private entityToThreeObj: Map<Entity, Object3D> = new Map();

	constructor(
		private world: World,
		private assetStore: AssetStore,
		private renderer: WebGLRenderer,
		private scene: Scene,
		private camera: PerspectiveCamera
	) {
		super();
	}

	public override async init() {
		const tower = this.assetStore.getObject('archerTowerLvl1');
		tower.scale.set(0.01, 0.01, 0.01);
		tower.position.set(50, 0, 0);
		this.camera.position.set(0, 50, 0);

		const light = new HemisphereLight(0xffffbb, 0x080820, 1);

		const controls = new OrbitControls(this.camera, this.renderer.domElement);
		controls.enableDamping = true;
		controls.target.set(0, 1, 0);
		this.scene.add(light);
		this.scene.add(tower);

		window.addEventListener('resize', this.onResize);
	}

	public override async update() {
		await this.newRenderables
			.withEntities()
			.each([read(Model3)], (entity, [model]) => {
				const obj = this.assetStore.getObject(model.model).clone(true);
				obj.scale.set(model.scale, model.scale, model.scale);
				this.scene.add(obj);
				this.entityToThreeObj.set(entity, obj);

				this.world.attach(entity, [ThreeObject], ([threeObj]) => {
					threeObj.entity = entity;
				});
			})
			.run();

		await this.activeRenderables
			.withEntities()
			.each([read(Position)], (entity, [position]) => {
				const mesh = this.entityToThreeObj.get(entity);

				mesh!.position.set(position.x, position.y, position.z);
			})
			.run();

		this.renderer.render(this.scene, this.camera);

		await this.flaggedForDestruction
			.each([read(ThreeObject)], ([threeObj]) => {
				const obj = this.entityToThreeObj.get(threeObj.entity);

				if (obj) {
					this.scene.remove(obj);
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
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	};
}
