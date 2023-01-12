import { WorldBuilder } from '@dark-star/ecs';
import { CORES_COUNT } from '@dark-star/worker-pool';
import { Scene, WebGLRenderer, Color } from 'three';

import { Keyboard } from './providers/keyboard.provider';

import { ClearVelocity } from './systems/clear-velocity.system';
import { PrepareMovement } from './systems/prepare-movement.system';
import { ApplyMovement } from './systems/apply-movement.system';
import { createAssetLoader } from './asset-loader';
import { AssetStore } from './asset-store';
import { RenderGroup } from './systems/render-group.system';
import { Position } from './components/position.data';
import { Velocity } from './components/velocity.data';
import { MovementControl } from './components/movement-control.data';
import { Player } from './components/player.tag';
import { PlayerMovementInput } from './systems/player-movement-input.system';
import { RenderThreeScene } from './systems/render-three-scene.system';
import { DeltaTime } from './providers/delta-time.provider';
import { Health } from './components/health.data';
import { InputGroup } from './systems/input-group.system';
import { SimulationGroup } from './systems/simulation-group.system';
import { Model } from './components/model.data';
import { Rotation } from './components/rotation.data';
import { SyncRotationToObject3D } from './systems/sync-rotation-to-object3d.system';
import { SyncPositionToObject3D } from './systems/sync-position-to-object3d.system';
import { RotationControl } from './components/rotation-control.data';
import { ApplyRotationControl } from './systems/apply-rotation-control.system';
import { PlayerRotationInput } from './systems/player-rotation-input.system';
import { FollowCamera } from './components/follow-camera.data';
import { FollowEntityWithCamera } from './systems/follow-entity-with-camera.system';
import { LookAt } from './components/look-at.data';
import { ManageThreeFollowCamera } from './systems/manage-three-follow-camera.system';
import { SyncLookAtToObject3D } from './systems/sync-lookat-to-object3d.system';
import { MovementAnimation } from './components/movement-animation.data';
import { SetMovementAnimation } from './systems/set-movement-animation.system';
import { RenderMovementAnimation } from './systems/render-movement-animation.system';

export const bootstrap = async (canvas: HTMLCanvasElement) => {
	const assetStore = await createAssetLoader()
		.addObject('archerTowerLvl1', 'assets/models/_archer_tower_LVL_1.fbx')
		.addObjectGLTF('Character', 'assets/models/Character.gltf')
		.addObjectGLTF('Enemy', 'assets/models/Enemy.gltf')
		.addObjectGLTF('Bee', 'assets/models/Bee.gltf')
		.addObjectGLTF('Crab', 'assets/models/Crab.gltf')
		.addObjectGLTF('Skull', 'assets/models/Skull.gltf')
		.addObjectGLTF('Tower', 'assets/models/Tower.gltf')
		.loadAssets();

	// THREE scene
	const scene = new Scene();
	scene.background = new Color('#99ccff');

	const renderer = new WebGLRenderer({
		canvas
	});
	renderer.shadowMap.enabled = true;
	renderer.setSize(window.innerWidth, window.innerHeight);
	// initialize delta time singleton
	const deltaT = new DeltaTime();

	// order of adding systems does not matter as long as they have their @updateBefore @updateAfter @group tags set
	const world = await new WorldBuilder()
		.useThreads(CORES_COUNT)
		.registerSingleton(Keyboard, new Keyboard().attach(window as any))
		.registerSingleton(AssetStore, assetStore)
		.registerSingleton(DeltaTime, deltaT)
		.registerSingleton(Scene, scene)
		.registerSingleton(WebGLRenderer, renderer)
		.registerSystem(InputGroup)
		.registerSystem(SimulationGroup)
		.registerSystem(RenderGroup)
		.registerSystem(PlayerMovementInput)
		.registerSystem(ClearVelocity)
		.registerSystem(SyncRotationToObject3D)
		.registerSystem(RenderThreeScene)
		.registerSystem(SyncPositionToObject3D)
		.registerSystem(ApplyRotationControl)
		.registerSystem(PlayerRotationInput)
		.registerSystem(ApplyMovement)
		.registerSystem(PrepareMovement)
		.registerSystem(FollowEntityWithCamera)
		.registerSystem(ManageThreeFollowCamera)
		.registerSystem(SyncLookAtToObject3D)
		.registerSystem(SetMovementAnimation)
		.registerSystem(RenderMovementAnimation)
		.build();

	// player
	world.spawn(
		[Position, Model, MovementControl, Health, RotationControl, Rotation, MovementAnimation, Velocity, Player],
		(playerEntity, [position, model, movement, health, rotationControl, rotation, movementAnimation]) => {
			position.x = 30;
			position.y = 0;
			position.z = 0;

			model.model = 'Character';
			model.scale = 5;

			movement.speedForward = 100 / 1000;
			movement.speedBackward = 50 / 1000;
			movement.speedSideways = 80 / 1000;

			health.maxHealth = 100;
			health.currentHealth = health.maxHealth;

			rotationControl.speed = 5 / 1000;

			rotation.y = 0.8;

			movementAnimation.idle = 'Idle';
			movementAnimation.run = 'Run';
			movementAnimation.walk = 'Walk';

			// spawn follow camera for player
			world.spawn([FollowCamera, Position, LookAt], (_, [followCamera]) => {
				followCamera.following = playerEntity;

				followCamera.targetOffsetX = -50;
				followCamera.targetOffsetY = 20;
				followCamera.targetOffsetZ = -30;

				followCamera.targetLookAtX = 0;
				followCamera.targetLookAtY = 10;
				followCamera.targetLookAtZ = 50;
			});
		}
	);

	// spawn a creep
	world.spawn(
		[Position, Model, MovementAnimation, MovementControl, Rotation, Velocity],
		(_, [position, model, movementAnimation, movement, rotation]) => {
			model.scale = 5;
			model.model = 'Enemy';

			// movement.forward = true;
			movement.speedForward = 50 / 1000;
			movement.speedBackward = 50 / 1000;
			movement.speedSideways = 80 / 1000;

			movementAnimation.idle = 'Idle';
			movementAnimation.run = 'Walk';
			movementAnimation.walk = 'Walk';

			rotation.y = -2;

			position.x = 10;
		}
	);

	// spawn a creep
	world.spawn(
		[Position, Model, MovementAnimation, MovementControl, Rotation, Velocity],
		(_, [position, model, movementAnimation, movement, rotation]) => {
			model.scale = 5;
			model.model = 'Bee';

			// movement.forward = true;
			movement.speedForward = 50 / 1000;
			movement.speedBackward = 50 / 1000;
			movement.speedSideways = 80 / 1000;

			movementAnimation.idle = 'Flying';
			movementAnimation.run = 'Flying';
			movementAnimation.walk = 'Flying';

			rotation.y = -2;

			position.x = 18;
		}
	);

	// spawn a creep
	world.spawn(
		[Position, Model, MovementAnimation, MovementControl, Rotation, Velocity],
		(_, [position, model, movementAnimation, movement, rotation]) => {
			model.scale = 5;
			model.model = 'Crab';

			movement.forward = true;
			movement.speedForward = 50 / 1000;
			movement.speedBackward = 50 / 1000;
			movement.speedSideways = 80 / 1000;

			movementAnimation.idle = 'Idle';
			movementAnimation.run = 'Walk';
			movementAnimation.walk = 'Walk';

			rotation.y = -2;

			position.x = 25;
		}
	);

	// apply deferred commands - spawn entities before gameloop begins
	await world.processDeferredCommands();

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
