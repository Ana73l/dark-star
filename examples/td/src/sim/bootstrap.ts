import { World, WorldBuilder } from '@dark-star/ecs';

import { Keyboard, createKeyboard } from './inputs/keyboard';
import { createAssetLoader } from './asset-loader';
import { AssetStore } from './asset-store';
import { InputSystem, PlayerControlled } from './input-system';
import { MovementSystem } from './movement-system';
import { RenderSystem } from './rendering/systems/render-system';

import { collisionsModule } from './collision-detection/collision.module';
import { RenderQuadtreeSystem } from './collision-detection/render-quadtree.system';
import { Shapes } from '../cd/shapes';

import { Shape } from './rendering/components/shape';
import { Collider } from './collision-detection/collider.component';
import { Position } from './components/position';
import { Velocity } from './components/velocity';

export const bootstrap = async (canvas: HTMLCanvasElement): Promise<World> => {
    const assetStore = await createAssetLoader().loadAssets();

    const world = await new WorldBuilder()
        .registerSingleton(Keyboard, createKeyboard().attach(window as any))
        .registerSingleton(CanvasRenderingContext2D, canvas.getContext('2d'))
        .registerSingleton(AssetStore, assetStore)
        .registerSystem(InputSystem)
        .registerSystem(MovementSystem)
        .registerModule(collisionsModule)
        .registerSystem(RenderSystem)
        .registerSystem(RenderQuadtreeSystem)
        .build();

    const getRandomInt = (start = 0, finish = 100): number => {
        const s = Math.ceil(start);
        const f = Math.floor(finish);

        return Math.floor(Math.random() * (f - s + 1)) + s;
    };

    world.spawn(30, [Position, Collider, Shape], (entity, [position, collider, shape], i) => {
        shape.shape = Shapes.Circle;
        shape.color = 'green';
        shape.radius = 20;

        collider.shape = {
            type: Shapes.Circle,
            radius: shape.radius
        };

        position.x = getRandomInt(0, canvas.clientWidth);
        position.y = getRandomInt(0, canvas.clientHeight);
    });

    world.spawn([Position, Collider, Shape, Velocity], (entity, [position, collider, shape, velocity]) => {
        shape.shape = Shapes.Circle;
        shape.radius = 20;

        collider.shape = {
            type: Shapes.Circle,
            radius: 20
        };

        velocity.x = 200 / 1000;
        position.y = 100;
        position.x = 100;
    });

    world.spawn([Position, Collider, Shape, PlayerControlled, Velocity], (entity, [position, collider, shape]) => {
        shape.shape = Shapes.Rectangle;
        shape.height = 50;
        shape.width = 70;
        shape.color = 'blue';

        collider.shape = {
            type: Shapes.Rectangle,
            width: 70,
            height: 50
        };

        position.y = 200;
        position.x = 300;
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
