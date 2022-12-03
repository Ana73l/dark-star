import { Entity } from '../entity';
import { ComponentType } from '../component';
import { ComponentTypes, ComponentTypesQuery, convertQueryToDescriptors, QueryRecord, read, write } from '../query';
import { WorldUpdateVersion } from '../world';
import { Job } from '../threads/jobs/job';
import { ECSEachJob } from '../threads/jobs/ecs-each';
import { ECSEachWithEntitiesJob } from '../threads/jobs/ecs-each-with-entities';
import {
	EntityEachLambda,
	EntityEachLambdaWithEntities,
	EntityEachLambdaWithEntitiesAndParams,
	EntityEachLambdaWithParams,
} from '../threads/entity-lambda';

import { System } from './planning/__internals__';
import { ComponentLookup } from './component-lookup';

/**
 * Provides a mechanism for iterating and invoking a lambda expression on each {@link Entity} selected by a {@link System.query query}.
 */
export class SystemQuery<TAll extends ComponentTypes, TSome extends ComponentTypes = [], TNone extends ComponentTypes = []> {
	public lastWorldVersion: WorldUpdateVersion = -1;

	private withChanges: boolean = false;

	/**
	 * @internal
	 * Creates a SystemQuery instance.
	 * 
	 * @remarks
	 * Used internally in a {@link Planner} to create system queries.
	 * 
	 * @see
	 * {@link System.query}\
	 * {@link entities}\
	 * {@link SystemType.queries}
	 * 
	 * @param system - {@link System} that has registered the query
	 * @param query - Persistent {@link QueryRecord} containing layout of the query and matching archetypes
	 */
	constructor(private system: System, private query: QueryRecord) {}

	/**
	 * Include only chunks that have been written to since last {@link System system} update.
	 * 
	 * @returns The SystemQuery instance
	 */
	public withChangedFilter(): SystemQuery<TAll, TSome, TNone> {
		this.withChanges = true;

		return this;
	}

	public getComponentLookup<T extends ComponentType, R extends boolean = false>(componentType: T, readonly?: R): ComponentLookup<T, R> {
		return new ComponentLookup(componentType, this.query, readonly);
	}

	/**
	 * Allows iteration on the results of a SystemQuery on the main thread or background threads.
	 * 
	 * @remarks
	 * Creates a {@link Job job} that iterates SystemQuery results on the main thread or background threads.
	 * Iteration is performed via callback, similar to an array.forEach
	 * 
	 * Component access is declared as first parameter and is used to determine the {@link Job} dependencies and prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 * {@link Job Jobs} can {@link read} the same data in parallel, but cannot {@link write}/ read-write in parallel. Whenever possible {@link read} access should be used.
	 * 
	 * Work {@link Job.schedule scheduled} to be done in background threads does not have access to main thread APIs or providers.
	 * If access to main thread APIs or providers is required, the {@link Job job} should be {@link Job.run ran} rather than {@link Job.schedule scheduled}.
	 * 
	 * @see
	 * {@link System.query}\
	 * {@link entities}\
	 * {@link SystemQuery.eachWithEntities}\
	 * {@link Job}
	 * 
	 * @param componentAccessDescriptors - List of read/ write {@link component} access descriptors. The descriptors will be used to determine {@link Job job} dependencies.
	 * @param lambda - Callback to be called on each set of {@link component} instances
	 * @returns A {@link Job} that can be {@link Job.run ran} on main thread or {@link Job.schedule scheduled} for execution on background thread(s)
	 * 
	 * @example
	 * ```ts
	 * @injectable()
	 * class RenderSprites extends System {
	 * 	@entities([Sprite, Position])
	 * 	public sprites: SystemQuery<[typeof Sprite, typeof Position]>;
	 * 
	 * 	// ...
	 * 
	 * 	public override async update() {
	 * 		const context = this.context;
	 * 		const assets = this.assets;
	 * 
	 * 		// run action on main thread as main thread APIs are required
	 * 		await this.sprites
	 * 			.each([read(Sprite), read(Position)], ([sprite, position]) => {
	 * 				const image = assets.getSprite(sprite.image);
	 * 
	 * 				context.drawImage(
	 * 					image, 
	 * 					0, 
	 * 					0, 
	 * 					image.width, 
	 * 					image.height, 
	 * 					position.x, 
	 * 					position.y,
	 * 					sprite.width,
	 * 					sprite.height
	 * 				);
	 * 			})
	 * 			.run();
	 * 	}
	 * }
	 * ```
	 */
	public each<T extends ComponentTypesQuery>(componentAccessDescriptors: T, lambda: EntityEachLambda<T, TAll, TSome, TNone>): Job;
	/**
	 * Allows iteration on the results of a SystemQuery on the main thread or background threads.
	 * Accepts a list of arguments that will also be passed to the callback function.
	 * 
	 * @remarks
	 * Creates a {@link Job job} that iterates SystemQuery results on the main thread or background threads.
	 * Iteration is performed via callback, similar to an array.forEach
	 * 
	 * Component access is declared as first parameter and is used to determine the {@link Job} dependencies and prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 * {@link Job Jobs} can {@link read} the same data in parallel, but cannot {@link write}/ read-write in parallel. Whenever possible {@link read} access should be used.
	 * 
	 * Work {@link Job.schedule scheduled} to be done in background threads does not have access to main thread APIs or providers.
	 * If access to main thread APIs or providers is required, the {@link Job job} should be {@link Job.run ran} rather than {@link Job.schedule scheduled}.
	 * 
	 * @see
	 * {@link System.query}\
	 * {@link entities}\
	 * {@link SystemQuery.eachWithEntities}\
	 * {@link Job}
	 * 
	 * @param componentAccessDescriptors - List of read/ write {@link component} access descriptors. The descriptors will be used to determine {@link Job job} dependencies.
	 * @param params - A list of arguments that will be also passed to the callback (and background threads if {@link Job.schedule scheduled})
	 * @param lambda - Callback to be called on each set of {@link component} instances
	 * @returns A {@link Job} that can be {@link Job.run ran} on main thread or {@link Job.schedule scheduled} for execution on background thread(s)
	 * 
	 * @example
	 * ```ts
	 * @injectable()
	 * class ApplyVelocity extends System {
	 * 	@entities([Position, Velocity])
	 * 	public moveables!: SystemQuery<[typeof Position, typeof Velocity]>;
	 * 
	 * 	constructor(private deltaT: DeltaTime) {
	 * 		super();
	 * 	}
	 * 
	 * 	// ...
	 * 
	 * 	public override async update() {
	 * 		// work does not require access to main thread APIs so it can be scheduled to be executed on background threads
	 * 		this.moveables
	 * 			.each([write(Position), read(Velocity)], [this.deltaT.value], ([position, velocity], [deltaT]) => {
	 * 				position.x += velocity.x * deltaT;
	 * 				position.y += velocity.y * deltaT;
	 * 			})
	 * 			.scheduleParallel();
	 * 	}
	 * }
	 * ```
	 */
	public each<T extends ComponentTypesQuery, P extends ReadonlyArray<any>>(
		componentAccessDescriptors: T,
		params: P,
		lambda: EntityEachLambdaWithParams<T, P, TAll, TSome, TNone>
	): Job;
	public each<T extends ComponentTypesQuery, P extends ReadonlyArray<any>>(
		componentAccessDescriptors: T,
		params: P | EntityEachLambda<T, TAll, TSome, TNone>,
		lambda?: EntityEachLambdaWithParams<T, P, TAll, TSome, TNone>
	): Job {
		if (typeof params === 'function') {
			return new ECSEachJob<T, TAll, TSome, TNone>(
				this.system,
				this.query,
				convertQueryToDescriptors(componentAccessDescriptors) as any,
				params,
				undefined,
				this.withChanges
			);
		} else {
			return new ECSEachJob<T, TAll, TSome, TNone>(
				this.system,
				this.query,
				convertQueryToDescriptors(componentAccessDescriptors) as any,
				lambda!,
				params,
				this.withChanges
			);
		}
	}

	/**
	 * Allows iteration on the results of a SystemQuery on the main thread or background threads.
	 * 
	 * @remarks
	 * Creates a {@link Job job} that iterates SystemQuery results on the main thread or background threads.
	 * Iteration is performed via callback, similar to an array.forEach
	 * 
	 * Component access is declared as first parameter and is used to determine the {@link Job} dependencies and prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 * {@link Job Jobs} can {@link read} the same data in parallel, but cannot {@link write}/ read-write in parallel. Whenever possible {@link read} access should be used.
	 * 
	 * Work {@link Job.schedule scheduled} to be done in background threads does not have access to main thread APIs or providers.
	 * If access to main thread APIs or providers is required, the {@link Job job} should be {@link Job.run ran} rather than {@link Job.schedule scheduled}.
	 * 
	 * @see
	 * {@link System.query}\
	 * {@link entities}\
	 * {@link SystemQuery.each}\
	 * {@link Job}
	 * 
	 * @param componentAccessDescriptors - List of read/ write {@link component} access descriptors. The descriptors will be used to determine {@link Job job} dependencies and prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 * @param lambda - Callback to be called on each set of {@link Entity} and its {@link component} instances
	 * @returns A {@link Job} that can be {@link Job.run ran} on main thread or {@link Job.schedule scheduled} for execution on background thread(s)
	 * 
	 * @example
	 * ```ts
	 * @injectable()
	 * class LogEntitiesWithPositionAndVelocityData extends System {
	 * 	// ...
	 * 
	 * 	public override async update() {
	 * 		// work does not require access to main thread APIs so it can be scheduled on background threads
	 * 		this.moveables
	 * 			.eachWithEntities([read(Position), read(Velocity)], (entity, [position, velocity]) => {
	 * 				console.log(entity, position, velocity);
	 * 			})
	 * 			.scheduleParallel();
	 * 	}
	 * }
	 * ```
	 */
	public eachWithEntities<T extends ComponentTypesQuery>(
		componentAccessDescriptors: T,
		lambda: EntityEachLambdaWithEntities<T, TAll, TSome, TNone>
	): Job;
	/**
	 * Allows iteration on the results of a SystemQuery on the main thread or background threads.
	 * Accepts a list of arguments that will also be passed to the callback function.
	 * 
	 * @remarks
	 * Creates a {@link Job job} that iterates SystemQuery results on the main thread or background threads.
	 * Iteration is performed via callback, similar to an array.forEach
	 * 
	 * Component access is declared as first parameter and is used to determine the {@link Job} dependencies and prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 * {@link Job Jobs} can {@link read} the same data in parallel, but cannot {@link write}/ read-write in parallel. Whenever possible {@link read} access should be used.
	 * 
	 * Work {@link Job.schedule scheduled} to be done in background threads does not have access to main thread APIs or providers.
	 * If access to main thread APIs or providers is required, the {@link Job job} should be {@link Job.run ran} rather than {@link Job.schedule scheduled}.
	 * 
	 * @see
	 * {@link System.query}\
	 * {@link entities}\
	 * {@link SystemQuery.each}\
	 * {@link Job}
	 * 
	 * @param componentAccessDescriptors - List of read/ write {@link component} access descriptors. The descriptors will be used to determine {@link Job job} dependencies and prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 * @param params - A list of arguments that will be also passed to the callback (and background threads if {@link Job.schedule scheduled})
	 * @param lambda - Callback to be called on each set of {@link Entity} and its {@link component} instances
	 * @returns A {@link Job} that can be {@link Job.run ran} on main thread or {@link Job.schedule scheduled} for execution on background thread(s)
	 * 
	 * @example
	 * ```ts
	 * @injectable()
	 * class ApplyVelocityAndLogEntities extends System {
	 * 	// ...
	 * 
	 * 	public override async update() {
	 * 		// work does not require access to main thread APIs so it can be scheduled on background threads
	 * 		this.moveables
	 * 			.eachWithEntities([write(Position), read(Velocity)], [this.deltaT.value], (entity, [position, velocity], [deltaT]) => {
	 * 				position.x += velocity.x * deltaT;
	 * 				position.y += velocity.y * deltaT;
	 * 
	 * 				console.log(`Position of entity ${entity} changed.`);
	 * 			})
	 * 			.scheduleParallel();
	 * 	}
	 * }
	 * ```
	 */
	public eachWithEntities<T extends ComponentTypesQuery, P extends ReadonlyArray<any>>(
		componentAccessDescriptors: T,
		params: P,
		lambda: EntityEachLambdaWithEntitiesAndParams<T, P, TAll, TSome, TNone>
	): Job;
	public eachWithEntities<T extends ComponentTypesQuery, P extends ReadonlyArray<any>>(
		componentAccessDescriptors: T,
		params: P | EntityEachLambdaWithEntities<T, TAll, TSome, TNone>,
		lambda?: EntityEachLambdaWithEntitiesAndParams<T, P, TAll, TSome, TNone>
	): Job {
		if (typeof params === 'function') {
			return new ECSEachWithEntitiesJob<T, TAll, TSome, TNone>(
				this.system,
				this.query,
				convertQueryToDescriptors(componentAccessDescriptors) as any,
				params,
				undefined,
				this.withChanges
			);
		} else {
			return new ECSEachWithEntitiesJob<T, TAll, TSome, TNone>(
				this.system,
				this.query,
				convertQueryToDescriptors(componentAccessDescriptors) as any,
				lambda!,
				params,
				this.withChanges
			);
		}
	}
}
