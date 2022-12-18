import { ComponentType, component } from './component';
import { $cleanupComponent } from './__internals__';

/**
 * Cleanup component constructor utility type.
 *
 * @see
 * {@link cleanupComponent}
 */
export type CleanupComponentType<T extends any = any> = ComponentType<T> & { [$cleanupComponent]?: true };

/**
 * Class decorator. Marks the target class as a cleanup component.
 *
 * @remarks
 * Cleanup components are like regular components or tags, but when an {@link Entity} is {@link World.destroy destroyed} that has one, all non-cleanup components are removed instead.
 * The {@link Entity entity} still exists until all cleanup components are removed.
 * Useful to mark entities that require cleanup when destroyed.
 *
 * The following example shows how to manage entities with cleanup components.
 *
 * @example
 * ```ts
 * @cleanupComponent()
 * class PixiJSSprite {
 * 	@uint32()
 * 	entity: Entity = 0;
 * }
 *
 * @injectable()
 * class RenderPixiSprites extends System {
 * 	// gather all entities with Sprite, but with no PixiJSSprite
 * 	@entities([Sprite], [], [PixiJSSprite])
 * 	public newRenderables!: SystemQuery<[typeof Sprite], [], [typeof PixiJSSprite]>;
 *
 * 	// active renderable entities with both Sprite and PixiJSSprite
 * 	@entities([Sprite, PixiJSSprite])
 * 	public activeRenderables!: SystemQuery<[typeof Sprite, typeof PixiJSSprite]>;
 *
 * 	// entities which have Sprite removed, but with a PixiJS representation
 * 	@entities([PixiJSSprite], [], [Sprite])
 * 	public destroyedRenderables!: SystemQuery<[typeof PixiJSSprite], [], [typeof Sprite]>;
 *
 * 	// ...
 *
 * 	public override async update() {
 * 		// init PixiJS rendering data and attach cleanup component flag to new renderables
 * 		await this.newRenderables
 * 			.withEntities()
 * 			.each([read(Sprite)], (entity, [sprite]) => {
 * 				// init PixiJs Sprite based on data from Sprite
 * 				// ...
 *
 * 				// attach PixiJSSprite cleanup component to flag entity
 * 				this.world.attach(entity, [PixiJSSprite], ([pixiSprite]) => {
 * 					pixiSprite.entity = entity;
 * 				});
 * 			})
 * 			.run();
 *
 * 		// render the active renderable entities
 * 		await this.activeRenderables
 * 			.each([read(PixiJSSprite), read(Position)], ([pixiSprite, position]) => {
 * 				// update position of pixi sprite and render
 * 			})
 * 			.run();
 *
 * 		// remove PixiJSSprite from entities that don't have Sprite (for example destroyed entities)
 * 		await this.destroyedRenderables
 * 			.each([read(PixiJSSprite)], ([pixiSprite]) => {
 * 				// remove PixiJS Sprite from scene and maybe pool it for reuse
 * 				// ...
 *
 * 				// detach PixiJSSprite from entity
 * 				this.world.detach(entity, [PixiJSSprite]);
 * 			})
 * 			.run();
 * 	}
 * }
 * ```
 *
 * @returns The target cleanup component constructor
 */
export const cleanupComponent: <T extends CleanupComponentType>() => (target: T) => T =
	() =>
	<T extends CleanupComponentType>(target: T): T => {
		target[$cleanupComponent] = true;

		return component()(target) as T;
	};
