import { System, group, Query, read, updateAfter, entities } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';

import { Position } from '../../movement/components/position.data';
import { ClearContextSystem } from './clear-context.system';
import { Sprite } from '../components/sprite.data';
import { AssetStore } from '../../asset-store';

import { RenderGroupSystem } from './render-group.system';

@injectable()
@group(RenderGroupSystem)
@updateAfter(ClearContextSystem)
export class RenderSpritesSystem extends System {
	@entities([Sprite, Position])
	public entities!: Query<[typeof Sprite, typeof Position]>;

	constructor(private context: CanvasRenderingContext2D, private assetStore: AssetStore) {
		super();
	}

	public override async update(): Promise<void> {
		const context = this.context;
		const assetStore = this.assetStore;
		/**
		 * Run this action on the main thread since we are accessing main thread APIs
		 */
		await this.entities
			.each([read(Sprite), read(Position)], ([sprite, position]) => {
				const image = assetStore.getSprite(sprite.image);

				context.drawImage(image, 0, 0, image.width, image.height, position.x, position.y, sprite.width, sprite.height);
			})
			.run();
	}
}