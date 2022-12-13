import { WorldBuilder } from '@dark-star/ecs';
import { createSharedObject } from '@dark-star/shared-object';

import { createKeyboard, Keyboard } from './providers/keyboard.provider';

import { ClearVelocity } from './systems/clear-velocity.system';
import { PrepareMovement } from './systems/prepare-movement.system';
import { ApplyMovement } from './systems/apply-movement.system';
import { Death } from './systems/death.system';
import { createAssetLoader } from './asset-loader';
import { AssetStore } from './asset-store';
import { RenderGroup } from './systems/render-group.system';
import { Position } from './components/position.data';
import { Velocity } from './components/velocity.data';
import { Movement } from './components/movement.data';
import { Player } from './components/player.tag';
import { PlayerMovementInput } from './systems/player-movement-input.system';
import { ClearContext } from './systems/clear-context.system';
import { RenderSprites } from './systems/render-sprites.system';
import { Sprite } from './components/sprite.data';
import { DeltaTime } from './providers/delta-time.provider';
import { CORES_COUNT } from '@dark-star/worker-pool';
import { Health } from './components/health.data';
import { EnemyMovement } from './systems/enemy-movement.system';
import { Weapon } from './components/weapon.data';
import { PlayerWeaponInput } from './systems/player-weapon-input.system';
import { FireWeapon } from './systems/fire-weapon.system';
import { EnemyCombatSystem } from './systems/enemy-combat.system';
import { Collider } from './components/collider.data';
import { DetectCollisions } from './systems/detect-collisions.system';
import { ApplyProjectileCollision } from './systems/apply-projectile-collision.system';
import { ClearColisions } from './systems/clear-collisions.system';
import { InputGroup } from './systems/input-group.system';
import { SimulationGroup } from './systems/simulation-group.system';

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
		.addSprite('laserRed06', 'assets/lasers/laserRed06.png')
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
		.registerSystem(InputGroup)
		.registerSystem(SimulationGroup)
		.registerSystem(RenderGroup)
		.registerSystem(PlayerMovementInput)
		.registerSystem(PlayerWeaponInput)
		.registerSystem(ClearVelocity)
		.registerSystem(ClearContext)
		.registerSystem(RenderSprites)
		.registerSystem(ApplyMovement)
		.registerSystem(PrepareMovement)
		.registerSystem(Death)
		.registerSystem(EnemyMovement)
		.registerSystem(EnemyCombatSystem)
		.registerSystem(FireWeapon)
		.registerSystem(DetectCollisions)
		.registerSystem(ApplyProjectileCollision)
		.registerSystem(ClearColisions)
		.build();

	// player
	world.spawn(
		[Position, Sprite, Movement, Health, Weapon, Collider, Velocity, Player],
		(_, [position, sprite, movement, health, weapon, collider]) => {
			position.x = 500;
			position.y = 500;

			sprite.image = 'playerShip1';
			sprite.width = 70;
			sprite.height = 50;

			collider.width = sprite.width;
			collider.height = sprite.height;

			movement.speedX = 600 / 1000;

			weapon.damage = 10;
			weapon.fireThrottle = 0.5;
			weapon.projectileSpeed = 1;
			weapon.projectileSprite = 'laserGreen06';
			weapon.direction = -1;
			weapon.offsetX = sprite.width / 2;

			health.maxHealth = 100;
			health.currentHealth = health.maxHealth;
		}
	);

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
