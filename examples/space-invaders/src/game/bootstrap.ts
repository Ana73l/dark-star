import { World, WorldBuilder } from '@dark-star/ecs';

import { Keyboard, createKeyboard } from './inputs/keyboard';
import { createAssetLoader } from './asset-loader';
import { AssetStore } from './asset-store';
import { InputSystem, PlayerControlled } from './input-system';

import { ApplyMovementSystem } from './movement/apply-movement.system';
import { PrepareMovementSystem } from './movement/prepare-movement.system';
import { Movement } from './movement/movement.component';

import RenderingModule from './rendering/rendering.module';
import { Background } from './rendering/background.component';
import { Sprite } from './rendering/sprite.component';

import CollisionsModule from './collision-detection/collision.module';
import { RenderQuadtreeSystem } from './collision-detection/debug/render-quadtree.system';
import { RenderCollidersSystem } from './collision-detection/debug/render-colliders.system';
import { Collider } from './collision-detection/collider.component';
import { Shapes } from '../cd/shapes';

import { FireWeaponSystem } from './combat/fire-weapon.system';
import { ProjectileCollisionSystem } from './combat/projectile-colllision.system';

import { ClearVelocitySytem } from './common/clear-velocity.system';
import { Position } from './common/position.component';
import { Velocity } from './common/velocity.component';

import { player } from './entities/player';

export const bootstrap = async (canvas: HTMLCanvasElement): Promise<World> => {
    const assetStore = await createAssetLoader()
        .addSprite('playerShip1', 'assets/spaceships/player/playerShip1_green.png')
        .addSprite('playerShip1damage1', 'assets/spaceships/player/playerShip1_damage1.png')
        .addSprite('playerShip1damage2', 'assets/spaceships/player/playerShip1_damage2.png')
        .addSprite('playerShip1damage3', 'assets/spaceships/player/playerShip1_damage3.png')
        .addSprite('laserGreen01', 'assets/lasers/laserGreen01.png')
        .addSprite('laserGreen06', 'assets/lasers/laserGreen06.png')
        .addSprite('meteor1', 'assets/meteors/meteorBrown_big1.png')
        .addSprite('blackBackground', 'assets/backgrounds/black.png')
        .loadAssets();

    const world = await new WorldBuilder()
        .registerSingleton(Keyboard, createKeyboard().attach(window as any))
        .registerSingleton(CanvasRenderingContext2D, canvas.getContext('2d'))
        .registerSingleton(AssetStore, assetStore)
        .registerSystem(ClearVelocitySytem)
        .registerSystem(InputSystem)
        .registerSystem(FireWeaponSystem)
        .registerSystem(PrepareMovementSystem)
        .registerSystem(ApplyMovementSystem)
        .registerModule(CollisionsModule)
        .registerSystem(ProjectileCollisionSystem)
        .registerModule(RenderingModule)
        // .registerSystem(RenderQuadtreeSystem)
        // .registerSystem(RenderCollidersSystem)
        .build();

    const getRandomInt = (start = 0, finish = 100): number => {
        const s = Math.ceil(start);
        const f = Math.floor(finish);

        return Math.floor(Math.random() * (f - s + 1)) + s;
    };

    // background
    world.spawn([Background], (entity, [background]) => {
        background.image = assetStore.getSprite('blackBackground');
    });

    // spawn player
    player(world, assetStore);

    // spawn meteors
    world.spawn(30, [Position, Collider, Sprite], (entity, [position, collider, sprite]) => {
        sprite.image = assetStore.getSprite('meteor1');
        sprite.height = 40;
        sprite.width = 40;

        collider.shape = {
            type: Shapes.Circle,
            radius: 20
        };

        position.x = getRandomInt(0, canvas.clientWidth);
        position.y = getRandomInt(0, canvas.clientHeight);
    });

    world.spawn([Position, Collider, Movement, Velocity], (entity, [position, collider, movement, velocity]) => {
        collider.shape = {
            type: Shapes.Circle,
            radius: 20
        };

        movement.right = true;
        movement.speed = 200 / 1000;

        position.y = 100;
        position.x = 100;
    });

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
