import { World, WorldBuilder } from '@dark-star/ecs';

import { Keyboard, createKeyboard } from './inputs/keyboard';
import { createAssetLoader } from './asset-loader';
import { AssetStore } from './asset-store';
import { InputSystem, PlayerControlled } from './input-system';
import { MovementSystem } from './movement-system';

import RenderingModule from './rendering/rendering.module';
import { Sprite } from './rendering/sprite.component';

import CollisionsModule from './collision-detection/collision.module';
import { RenderQuadtreeSystem } from './collision-detection/debug/render-quadtree.system';
import { RenderCollidersSystem } from './collision-detection/debug/render-colliders.system';
import { Shapes } from '../cd/shapes';

import { Collider } from './collision-detection/collider.component';
import { Position } from './components/position';
import { Velocity } from './components/velocity';

export const bootstrap = async (canvas: HTMLCanvasElement): Promise<World> => {
    const assetStore = await createAssetLoader()
        .addSprite('player', 'assets/spaceships/playerShip1_green.png')
        .addSprite('meteor1', 'assets/meteors/meteorBrown_big1.png')
        .loadAssets();

    const world = await new WorldBuilder()
        .registerSingleton(Keyboard, createKeyboard().attach(window as any))
        .registerSingleton(CanvasRenderingContext2D, canvas.getContext('2d'))
        .registerSingleton(AssetStore, assetStore)
        .registerSystem(InputSystem)
        .registerSystem(MovementSystem)
        .registerModule(CollisionsModule)
        .registerModule(RenderingModule)
        .registerSystem(RenderQuadtreeSystem)
        .registerSystem(RenderCollidersSystem)
        .build();

    const getRandomInt = (start = 0, finish = 100): number => {
        const s = Math.ceil(start);
        const f = Math.floor(finish);

        return Math.floor(Math.random() * (f - s + 1)) + s;
    };

    // spawn player
    world.spawn([Position, Collider, Sprite, PlayerControlled, Velocity], (entity, [position, collider, sprite]) => {
        sprite.image = assetStore.getSprite('player');
        sprite.width = 70;
        sprite.height = 50;

        collider.shape = {
            type: Shapes.Rectangle,
            width: 70,
            height: 50
        };

        position.y = 200;
        position.x = 300;
    });

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

    world.spawn([Position, Collider, Velocity], (entity, [position, collider, velocity]) => {
        collider.shape = {
            type: Shapes.Circle,
            radius: 20
        };

        velocity.x = 200 / 1000;
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
