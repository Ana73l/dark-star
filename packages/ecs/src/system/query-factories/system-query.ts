import { ComponentTypes, ComponentTypesQuery } from '../../query';
import { Job, JobArgs, ParallelJob } from '../../threads/jobs/job';
import { ECSEachJob } from '../../threads/jobs/ecs-each';
import { EntityEachLambda } from '../../threads/entity-lambda';

import { System } from '../planning/__internals__';
import { SystemQueryWithEntities } from './system-query-with-entities';
import { SystemQueryBase } from './system-query-base';

/**
 * Provides a mechanism for iterating and invoking a lambda expression on the {@link component components} of {@link Entity entities} selected by a {@link System.query query}.
 *
 * @remarks
 * The iterator callbacks are only passed the {@link component} instances. If {@link Entity entities} are also required, use the {@link SystemQuery.withEntities} method.
 *
 * @see
 * {@link SystemQueryWithEntities}
 *
 * @example
 * ```ts
 * @injectable()
 * class ApplyDamage extends System {
 * 	// ...
 *
 * 	public override async update() {
 * 		this.damageables
 * 			.each([write(Health), read(IncomingDamage)], ([health, damage]) => {
 * 				health.currentHealth -= damage.value;
 * 			})
 * 			.scheduleParallel();
 * 	}
 * }
 *
 * @injectable()
 * class ApplyVelocity extends System {
 * 	// ...
 *
 * 	public override async update() {
 * 		// optionally parameters can also be passed
 * 		this.moveables
 * 			.each([write(Position), read(Velocity)], [this.deltaT.value], ([position, velocity], [deltaT]) => {
 * 				position.x += velocity.x * deltaT;
 * 				position.y += velocity.y * deltaT;
 * 				position.z += velocity.z * deltaT;
 * 			})
 * 			.scheduleParallel();
 * 	}
 * }
 * ```
 */
export class SystemQuery<
	TAll extends ComponentTypes,
	TSome extends ComponentTypes = [],
	TNone extends ComponentTypes = []
> extends SystemQueryBase<TAll, TSome, TNone> {
	/**
	 *
	 * @returns
	 */
	public withEntities(): SystemQueryWithEntities<TAll, TSome, TNone> {
		return new SystemQueryWithEntities(this.system, this.query, this.withChanges);
	}

	/**
	 * Allows iteration on the results of a SystemQuery on the main thread or background threads.
	 *
	 * @remarks
	 * Creates a {@link Job job} that iterates SystemQuery results on the main thread or background threads.
	 * Iteration is performed via callback, similar to an array.forEach.
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
	public each<T extends ComponentTypesQuery>(
		componentAccessDescriptors: T,
		lambda: EntityEachLambda<T, TAll, TSome, TNone, undefined>
	): ParallelJob;
	/**
	 * Allows iteration on the results of a SystemQuery on the main thread or background threads.
	 * Accepts a list of arguments that will also be passed to the callback function.
	 *
	 * @remarks
	 * Creates a {@link Job job} that iterates SystemQuery results on the main thread or background threads.
	 * Iteration is performed via callback, similar to an array.forEach.
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
	public each<T extends ComponentTypesQuery, P extends JobArgs>(
		componentAccessDescriptors: T,
		params: P,
		lambda: EntityEachLambda<T, TAll, TSome, TNone, P>
	): ParallelJob;
	public each<T extends ComponentTypesQuery, P extends JobArgs>(
		componentAccessDescriptors: T,
		params: P | EntityEachLambda<T, TAll, TSome, TNone, undefined>,
		lambda?: EntityEachLambda<T, TAll, TSome, TNone, P>
	): ParallelJob {
		if (typeof params === 'function') {
			return new ECSEachJob<T, TAll, TSome, TNone>(
				this.system,
				this.query,
				componentAccessDescriptors,
				params,
				undefined,
				this.withChanges
			);
		} else {
			return new ECSEachJob<T, TAll, TSome, TNone>(
				this.system,
				this.query,
				componentAccessDescriptors,
				lambda!,
				params,
				this.withChanges
			);
		}
	}
}
