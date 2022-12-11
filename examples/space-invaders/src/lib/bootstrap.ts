import { WorldBuilder } from '@dark-star/ecs';
import { createSharedObject } from '@dark-star/shared-object';

import { createKeyboard, Keyboard } from './input/providers/keyboard';

import { ClearVelocity } from './movement/systems/clear-velocity.system';
import { PrepareMovement } from './movement/systems/prepare-movement.system';
import { ApplyMovement } from './movement/systems/apply-movement.system';
import { Death } from './combat/systems/death.system';
import { createAssetLoader } from './asset-loader';
import { AssetStore } from './asset-store';
import { RenderGroup } from './rendering/systems/render-group.system';
import { Position } from './movement/components/position.data';
import { Velocity } from './movement/components/velocity.data';
import { Movement } from './movement/components/movement.data';
import { Player } from './tags/player';
import { PlayerInput } from './input/systems/player-input.system';
import { ClearContext } from './rendering/systems/clear-context.system';
import { RenderSprites } from './rendering/systems/render-sprites.system';
import { Sprite } from './rendering/components/sprite.data';
import { DeltaTime } from './delta-time';
import { CORES_COUNT } from '@dark-star/worker-pool';
import { Health } from './combat/components/health.data';
import { EnemyMovement } from './enemy/systems/enemy-movement.system';
import { RemoveHealthFromEntityOne } from './removeHealthFromEntityOne';
import { Enemy } from './enemy/components/enemy.data';

export const bootstrap = async (canvas: HTMLCanvasElement) => {
	const assetStore = await createAssetLoader()
		.addSprite('playerShip1', 'assets/spaceships/player/playerShip1_green.png')
		.addSprite('playerShip1damage1', 'assets/spaceships/player/playerShip1_damage1.png')
		.addSprite('playerShip1damage2', 'assets/spaceships/player/playerShip1_damage2.png')
		.addSprite('playerShip1damage3', 'assets/spaceships/player/playerShip1_damage3.png')
		.addSprite('enemyBlack1', 'assets/spaceships/enemy/enemyBlack1.png')
		.addSprite('enemyBlack2', 'assets/spaceships/enemy/enemyBlack2.png')
		.addSprite('enemyBlack3', 'assets/spaceships/enemy/enemyBlack3.png')
		.addSprite('enemyBlack4', 'assets/spaceships/enemy/enemyBlack4.png')
		.addSprite('enemyBlack5', 'assets/spaceships/enemy/enemyBlack5.png')
		.addSprite('enemyBlue1', 'assets/spaceships/enemy/enemyBlue1.png')
		.addSprite('enemyBlue2', 'assets/spaceships/enemy/enemyBlue2.png')
		.addSprite('enemyBlue3', 'assets/spaceships/enemy/enemyBlue3.png')
		.addSprite('enemyBlue4', 'assets/spaceships/enemy/enemyBlue4.png')
		.addSprite('enemyBlue5', 'assets/spaceships/enemy/enemyBlue5.png')
		.addSprite('enemyGreen1', 'assets/spaceships/enemy/enemyGreen1.png')
		.addSprite('enemyGreen2', 'assets/spaceships/enemy/enemyGreen2.png')
		.addSprite('enemyGreen3', 'assets/spaceships/enemy/enemyGreen3.png')
		.addSprite('enemyGreen4', 'assets/spaceships/enemy/enemyGreen4.png')
		.addSprite('enemyGreen5', 'assets/spaceships/enemy/enemyGreen5.png')
		.addSprite('enemyRed1', 'assets/spaceships/enemy/enemyRed1.png')
		.addSprite('enemyRed2', 'assets/spaceships/enemy/enemyRed2.png')
		.addSprite('enemyRed3', 'assets/spaceships/enemy/enemyRed3.png')
		.addSprite('enemyRed4', 'assets/spaceships/enemy/enemyRed4.png')
		.addSprite('enemyRed5', 'assets/spaceships/enemy/enemyRed5.png')
		.addSprite('laserGreen01', 'assets/lasers/laserGreen01.png')
		.addSprite('laserGreen06', 'assets/lasers/laserGreen06.png')
		.addSprite('meteor1', 'assets/meteors/meteorBrown_big1.png')
		.addSprite('blackBackground', 'assets/backgrounds/black.png')
		.addSound('laser1', 'assets/sounds/sfx_laser1.ogg')
		.loadAssets();

	// intialize shared object singleton
	const deltaT = createSharedObject(DeltaTime);

	// order of adding systems does not matter as long as they have their @updateBefore @updateAfter @group tags set
	const world = await new WorldBuilder()
		.useThreads(CORES_COUNT)
		.registerSingleton(CanvasRenderingContext2D, canvas.getContext('2d'))
		.registerSingleton(Keyboard, createKeyboard().attach(window as any))
		.registerSingleton(AssetStore, assetStore)
		.registerSingleton(DeltaTime, deltaT)
		.registerSystem(PlayerInput)
		.registerSystem(ClearVelocity)
		.registerSystem(ClearContext)
		.registerSystem(RenderSprites)
		.registerSystem(ApplyMovement)
		.registerSystem(PrepareMovement)
		// .registerSystem(RemoveHealthFromEntityOne)
		.registerSystem(Death)
		.registerSystem(RenderGroup)
		.registerSystem(EnemyMovement)
		.build();

	world.spawn([Position, Sprite, Movement, Velocity, Player], (_, [position, sprite, movement]) => {
		position.x = 500;
		position.y = 500;

		sprite.image = 'playerShip1';
		sprite.width = 70;
		sprite.height = 50;

		movement.speed = 600 / 1000;
	});

	let prevTime = 0.0;

	const loop = async (time: number) => {
		deltaT.value = time - prevTime;

		await world.step();

		prevTime = time;

		requestAnimationFrame(loop);
	};

	requestAnimationFrame(loop);

	return world;
};
