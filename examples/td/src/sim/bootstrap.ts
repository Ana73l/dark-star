import { World, WorldBuilder } from '@dark-star/ecs';

import { Keyboard, createKeyboard } from './inputs/keyboard';
import { createAssetLoader } from './asset-loader';
import { AssetStore } from './asset-store';
import { InputSystem, PlayerControlled } from './input-system';
import { MovementSystem } from './movement-system';
import { RenderSystem } from './rendering/systems/render-system';

import { Shape, Shapes } from './rendering/components/shape';
import { Position } from './components/position';
import { Velocity } from './components/velocity';

export const bootstrap = async (canvas: HTMLCanvasElement): Promise<World> => {
    const assetStore = await createAssetLoader().loadAssets();

    const world = await new WorldBuilder()
        .registerSingleton(Keyboard, createKeyboard().attach(window as any))
        .registerSingleton(CanvasRenderingContext2D, canvas.getContext('2d'))
        .registerSingleton(AssetStore, assetStore)
        .registerSystem(InputSystem)
        .registerSystem(RenderSystem)
        .registerSystem(MovementSystem)
        .build();

    world.spawn([Position, Shape, Velocity], (entity, [position, shape, velocity]) => {
        shape.shape = Shapes.Circle;
        shape.radius = 20;

        velocity.x = 200 / 1000;
        position.y = 100;
        position.x = 100;
    });

    world.spawn([Position, Shape], (entity, [position, shape]) => {
        shape.shape = Shapes.Circle;
        shape.radius = 30;
        shape.color = 'green';

        position.y = 200;
        position.x = 100;
    });

    world.spawn([Position, Shape, PlayerControlled, Velocity], (entity, [position, shape]) => {
        shape.shape = Shapes.Rectangle;
        shape.height = 50;
        shape.width = 70;
        shape.color = 'blue';

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
