import { WorldBuilder } from '@dark-star/ecs';
import { coresCount } from '@dark-star/worker-pool';

import { createKeyboard, Keyboard } from './keyboard';

import { ClearVelocitySytem } from './movement/clear-velocity.system';
import { PrepareMovementSystem } from './movement/prepare-movement.system';
import { ApplyMovementSystem } from './movement/apply-movement.system';
import { DeathSystem } from './combat/death.system';
import { createAssetLoader } from './asset-loader';
import { AssetStore } from './asset-store';

export const bootstrap = async (canvas: HTMLCanvasElement) => {
	const assetStore = await createAssetLoader().loadAssets();

	const world = await new WorldBuilder()
		.useThreads(coresCount - 1)
		.registerSingleton(CanvasRenderingContext2D, canvas.getContext('2d'))
		.registerSingleton(Keyboard, createKeyboard().attach(window as any))
		.registerSingleton(AssetStore, assetStore)
		.registerSystem(ClearVelocitySytem)
		// order of adding systems does not matter as long as they have their @updateBefore @updateAfter @group tags set
		.registerSystem(ApplyMovementSystem)
		.registerSystem(PrepareMovementSystem)
		.registerSystem(DeathSystem)
		.build();

	let prevTime = 0.0;

	const loop = async (time: number) => {
		const deltaT = time - prevTime;
		prevTime = time;

		await world.step(deltaT);

		requestAnimationFrame(loop);
	};

	requestAnimationFrame((time) => {
		prevTime = time;

		requestAnimationFrame(loop);
	});

	return world;
};
