import { World, WorldBuilder } from '@dark-star/ecs';

import { Keyboard, createKeyboard } from './inputs/keyboard';
import { createAssetLoader } from './asset-loader';
import { AssetStore } from './asset-store';

import { ApplyMovementSystem } from './movement/apply-movement.system';
import { PrepareMovementSystem } from './movement/prepare-movement.system';

import RenderingModule from './rendering/rendering.module';
import { Background } from './rendering/background.component';

import CollisionsModule from './collision-detection/collision.module';
import { RenderQuadtreeSystem } from './collision-detection/debug/render-quadtree.system';
import { RenderCollidersSystem } from './collision-detection/debug/render-colliders.system';

import { FireWeaponSystem } from './combat/fire-weapon.system';
import { ProjectileCollisionSystem } from './combat/projectile-collision.system';
import { DeathSystem } from './combat/death.system';

import { ClearVelocitySytem } from './common/clear-velocity.system';
import { LifeTimeSystem } from './common/life-time.system';

import { player } from './entities/player/player';
import { PlayerInputSystem } from './entities/player/player-input.system';

import { enemies } from './entities/enemy/enemies';
import { EnemyMovementSystem } from './entities/enemy/enemy-movement.system';
import { EnemyCombatSystem } from './entities/enemy/enemy-combat.system';

export const bootstrap = async (canvas: HTMLCanvasElement): Promise<World> => {
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

    const world = await new WorldBuilder()
        .registerSingleton(Keyboard, createKeyboard().attach(window as any))
        .registerSingleton(CanvasRenderingContext2D, canvas.getContext('2d'))
        .registerSingleton(AssetStore, assetStore)
        .registerSystem(ClearVelocitySytem)
        .registerSystem(PlayerInputSystem)
        .registerSystem(EnemyMovementSystem)
        .registerSystem(EnemyCombatSystem)
        .registerSystem(PrepareMovementSystem)
        .registerSystem(ApplyMovementSystem)
        .registerSystem(FireWeaponSystem)
        .registerModule(CollisionsModule)
        .registerSystem(ProjectileCollisionSystem)
        .registerSystem(DeathSystem)
        .registerSystem(LifeTimeSystem)
        .registerModule(RenderingModule)
        .registerSystem(RenderQuadtreeSystem)
        .registerSystem(RenderCollidersSystem)
        .build();

    // background
    world.spawn([Background], (entity, [background]) => {
        background.image = 'blackBackground';
    });

    // spawn player
    player(world, assetStore);

    // spawn enemies
    enemies(world, assetStore);

    // spawn meteors
    // world.spawn(30, [Position, Collider, Sprite], (entity, [position, collider, sprite]) => {
    //     sprite.image = assetStore.getSprite('meteor1');
    //     sprite.height = 40;
    //     sprite.width = 40;

    //     collider.shape = {
    //         type: Shapes.Circle,
    //         radius: 20
    //     };

    //     position.x = getRandomInt(0, canvas.clientWidth);
    //     position.y = getRandomInt(0, canvas.clientHeight);
    // });

    let prevTime = 0.0;

    const loop = (time: number) => {
        const deltaT = time - prevTime;
        prevTime = time;

        world.step(deltaT);

        requestAnimationFrame(loop);
    };

    requestAnimationFrame((time) => {
        prevTime = time;

        requestAnimationFrame(loop);
    });

    console.log(world);

    return world;
};
