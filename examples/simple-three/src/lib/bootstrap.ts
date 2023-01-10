import { WorldBuilder } from '@dark-star/ecs';
import { CORES_COUNT } from '@dark-star/worker-pool';
import { Scene, PerspectiveCamera, WebGLRenderer, Color } from 'three';

import { Keyboard } from './providers/keyboard.provider';

import { ClearVelocity } from './systems/clear-velocity.system';
import { PrepareMovement } from './systems/prepare-movement.system';
import { ApplyMovement } from './systems/apply-movement.system';
import { Death } from './systems/death.system';
import { createAssetLoader } from './asset-loader';
import { AssetStore } from './asset-store';
import { RenderGroup } from './systems/render-group.system';
import { Position } from './components/position.data';
import { Velocity } from './components/velocity.data';
import { MovementControl } from './components/movement-control.data';
import { Player } from './components/player.tag';
import { PlayerMovementInput } from './systems/player-movement-input.system';
import { RenderThreeScene } from './systems/render-three-scene';
import { DeltaTime } from './providers/delta-time.provider';
import { Health } from './components/health.data';
import { PlayerWeaponInput } from './systems/player-weapon-input.system';
import { EnemyCombatSystem } from './systems/enemy-combat.system';
import { DetectCollisions } from './systems/detect-collisions.system';
import { ResolveProjectileCollision } from './systems/resolve-projectile-collision.system';
import { ClearColisions } from './systems/clear-collisions.system';
import { InputGroup } from './systems/input-group.system';
import { SimulationGroup } from './systems/simulation-group.system';
import { Model3 } from './components/model3.data';
import { Rotation } from './components/rotation.data';
import { SyncRotationToObject3D } from './systems/sync-rotation-to-object3d.system';
import { SyncPositionToObject3D } from './systems/sync-position-to-object3d.system';
import { RotationControl } from './components/rotation-control.data';
import { ApplyRotationControl } from './systems/apply-rotation-control.system';
import { PlayerRotationInput } from './systems/player-rotation-input.system';

export const bootstrap = async (canvas: HTMLCanvasElement) => {
	const assetStore = await createAssetLoader()
		.addObject('archerTowerLvl1', 'assets/models/_archer_tower_LVL_1.fbx')
		.addObject('peasant1', 'assets/models/peasant_1.fbx')
		.addObject('king', 'assets/models/king.fbx')
		.addObjectGLTF('Character', 'assets/models/Character.gltf')
		.addObjectGLTF('Enemy', 'assets/models/Enemy.gltf')
		.loadAssets();

	// THREE scene
	const scene = new Scene();
	scene.background = new Color('#99ccff');
	const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 1000);
	camera.position.set(25, 10, 25);

	const renderer = new WebGLRenderer({
		canvas
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	// initialize delta time singleton
	const deltaT = new DeltaTime();

	// order of adding systems does not matter as long as they have their @updateBefore @updateAfter @group tags set
	const world = await new WorldBuilder()
		.useThreads(CORES_COUNT)
		.registerSingleton(Keyboard)
		.registerSingleton(AssetStore, assetStore)
		.registerSingleton(DeltaTime, deltaT)
		.registerSingleton(Scene, scene)
		.registerSingleton(WebGLRenderer, renderer)
		.registerSingleton(PerspectiveCamera, camera)
		.registerSystem(InputGroup)
		.registerSystem(SimulationGroup)
		.registerSystem(RenderGroup)
		.registerSystem(PlayerMovementInput)
		.registerSystem(PlayerWeaponInput)
		.registerSystem(ClearVelocity)
		.registerSystem(SyncRotationToObject3D)
		.registerSystem(RenderThreeScene)
		.registerSystem(SyncPositionToObject3D)
		.registerSystem(ApplyRotationControl)
		.registerSystem(PlayerRotationInput)
		.registerSystem(ApplyMovement)
		.registerSystem(PrepareMovement)
		.registerSystem(Death)
		.registerSystem(ResolveProjectileCollision)
		.registerSystem(EnemyCombatSystem)
		.registerSystem(DetectCollisions)
		.registerSystem(ClearColisions)
		.build();

	// player
	world.spawn(
		[Position, Model3, MovementControl, Health, RotationControl, Rotation, Velocity, Player],
		(_, [position, model3, movement, health, rotationControl, rotation]) => {
			position.x = 30;
			position.y = 0;
			position.z = 0;

			model3.model = 'Character';
			model3.scale = 5;

			movement.speedForward = 100 / 1000;
			movement.speedBackward = 50 / 1000;
			movement.speedSideways = 80 / 1000;

			health.maxHealth = 100;
			health.currentHealth = health.maxHealth;

			rotationControl.speed = 5 / 1000;

			rotation.y = 0.8;
		}
	);

	let prevTime = performance.now();

	const loop = async (time: number) => {
		deltaT.value = time - prevTime;

		await world.step();

		prevTime = time;

		requestAnimationFrame(loop);
	};

	loop(0);

	return world;
};
