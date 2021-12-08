import {} from '@dark-star/ecs';
import { createAssetLoader } from './asset-loader';
import { AssetStore } from './asset-store';
import { RenderSystem } from './rendering/systems/render-system';

import { Shape, Shapes } from './rendering/components/shape';
import { Position } from './components/position';

export const bootstrap = async (canvas: HTMLCanvasElement): Promise<World> => {
    const assetStore = await createAssetLoader().loadAssets();

    const world = await new WorldBuilder()
        .registerSingleton(CanvasRenderingContext2D, canvas.getContext('2d'))
        .registerSingleton(AssetStore, assetStore)
        .registerSystem(RenderSystem)
        .build();

    world.spawn([Position, Shape], (entity, [position, shape]) => {
        shape.shape = Shapes.Circle;
        shape.radius = 5;
    });

    return world;
};
