import { Disposable } from '@dark-star/core';

import { ComponentType } from '../component/component';
import { Entity } from '../entity';
import { ComponentTypes, ComponentInstancesFromTypes } from '../query';

/** Current world version. Used to track for changes. */
export type WorldUpdateVersion = number;

/**
 * Worlds maintain entities and execute systems.
 *
 * @remarks
 * Worlds (when used on the main thread) can {@link World.spawn spawn} {@link Entity entities}, be queried whether they {@link World.exists},
 * {@link World.attach attach}, {@link World.detach} {@link component components} to entities, check whether entities {@link World.has have} component types attached to them,
 * {@link World.get retrieve} the component instances attached to an entity and {@link World.destroy destroy} entities.
 *
 * On background threads, only {@link World.spawn}, {@link World.attach}, {@link World.detach} and {@link World.destroy} can be used.
 *
 * Worlds cannot be initialized directly. Use {@link WorldBuilder} to construct and initialize worlds.
 *
 * @see
 * {@link WorldBuilder}
 */
export abstract class World implements Disposable {
	/** Current world version. Incremented each time {@link World.step} is called. */
	abstract readonly version: WorldUpdateVersion;
	/** Indicates whether world has been disposed. */
	abstract readonly isDisposed: boolean;
	/** Indicates whether {@link World.step} is currently in progress. */
	abstract readonly isStepInProgress: boolean;

	/**
	 * Spawns an entity with no components in the world.
	 *
	 * @example
	 * ```ts
	 * world.spawn();
	 * ```
	 */
	abstract spawn(): void;
	/**
	 * Spawns an entity with a list of component types in the world.
	 *
	 * @param componentTypes - List of component types to be attached
	 *
	 * @example
	 * ```ts
	 * world.spawn([Player, Position, Velocity]);
	 * ````
	 */
	abstract spawn<T extends ComponentTypes>(componentTypes: T): void;
	/**
	 * Spawns an entity with a list of component types in the world and assigns their values using a given callback.
	 *
	 * @param componentTypes - List of component types to be attached
	 * @param init - Callback used to initialize component values. New entity id is passed as first parameter
	 *
	 * @remarks
	 * When called from a background thread - entity parameter of callback is always -1
	 *
	 * @example
	 * ```ts
	 * world.spawn([Player, Position, Velocity], (entity, [player, position, velocity]) => {
	 * 	console.log(`Spawned entity id: ${entity}`);
	 *
	 * 	player.name = 'Stormrage';
	 *
	 * 	position.x = 100;
	 * 	position.y = -15;
	 *
	 * 	velocity.y = 0;
	 * });
	 * ```
	 */
	abstract spawn<T extends ComponentTypes>(
		componentTypes: T,
		init: (entity: Entity, components: ComponentInstancesFromTypes<T>) => void
	): void;

	/**
	 * Checks whether a given entity exists in the world.
	 *
	 * @param entity - Entity which will be checked.
	 *
	 * @example
	 * ```ts
	 * world.exists(5);
	 * ```
	 */
	abstract exists(entity: Entity): boolean;

	/**
	 * Checks whether a given entity exists and has a given component type attached to it.
	 *
	 * @param entity - Entity which will be checked
	 * @param componentType - Component type to be checked
	 *
	 * @example
	 * ```ts
	 * world.has(5, Position);
	 * ```
	 */
	abstract has<T extends ComponentType>(entity: Entity, componentType: T): boolean;

	/**
	 * Retrieves the given component instance from an existing entity.
	 *
	 * @param entity - Entity whose component instance should be retrieved
	 * @param componentType - Component type to be retrieved
	 *
	 * @example
	 * ```ts
	 * const position = world.get(5, Position);
	 * ```
	 */
	abstract get<T extends ComponentType>(entity: Entity, componentType: T): InstanceType<T> | undefined;

	/**
	 * Attaches one or more component types to an existing entity.
	 *
	 * @param {Entity} entity - Entity to which components will be attached
	 * @param componentTypes - List of component types to attach
	 *
	 * @example
	 * ```ts
	 * world.attach(5, [Position, Velocity]);
	 * ```
	 */
	abstract attach<T extends ComponentTypes>(entity: Entity, componentTypes: T): void;
	/**
	 * Attaches one or more component types to an existing entities and assigns their values using a given callback.
	 *
	 * @param entity - Entity to which components will be attached
	 * @param componentTypes - List of component types to attach
	 * @param init - Callback used to initialize component values
	 *
	 * @example
	 * ```ts
	 * world.attach(5, [Position, Velocity], ([position, velocity]) => {
	 * 	position.x = 1;
	 * 	position.y = 2;
	 *
	 * 	velocity.x = 0;
	 * });
	 * ```
	 */
	abstract attach<T extends ComponentTypes>(
		entity: Entity,
		componentTypes: T,
		init: (components: ComponentInstancesFromTypes<T>) => void
	): void;

	/**
	 * Detaches one or more component types from an existing entity.
	 *
	 * @param entity - Entity from which components will be detached
	 * @param componentTypes - List of component types to detach
	 *
	 * @example
	 * ```ts
	 * world.detach(5, [Alive, MovementInput]);
	 * ```
	 */
	abstract detach<T extends ComponentTypes>(entity: Entity, componentTypes: T): void;

	/**
	 * Removes an entity from the world.
	 *
	 * @param entity - Entity to be removed
	 *
	 * @example
	 * ```ts
	 * world.destroy(5);
	 * ```
	 */
	abstract destroy(entity: Entity): void;

	/**
	 * Completes all {@link Job jobs} and processes all the deferred {@link Entity} commands.
	 *
	 * @remarks
	 * Entity commands ({@link World.spawn spawn}, {@link World.attach attach}, {@link World.detach detach} and {@link World.destroy destroy})
	 * are processed by the World at the beginning of each frame. This method allows premature processing of deferred commands.
	 *
	 * @example
	 * ```ts
	 * await world.processDeferredCommands();
	 * ```
	 */
	abstract processDeferredCommands(): Promise<void>;

	/**
	 * Executes all deferred commands and systems in the world.
	 *
	 * @example
	 * ```ts
	 * // create a game loop
	 * const gameLoop = async (time: number) => {
	 * 	await world.step();
	 *
	 * 	requestAnimationFrame(gameLoop);
	 * }
	 *
	 * // start the game loop
	 * requestAnimationFrame(gameLoop);
	 * ```
	 */
	abstract step(): Promise<void>;

	/**
	 * Completes the current executing step, destroys worker threads that have been spawned and prevents any future steps from being scheduled.
	 *
	 * @example
	 * ```ts
	 * await world.dispose();
	 * ```
	 */
	abstract dispose(): Promise<void>;
}
