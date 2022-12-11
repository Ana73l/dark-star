import { ComponentTypes, ComponentTypesQuery } from '../../query';
import { EntityEachLambdaWithEntities } from '../../threads/entity-lambda';
import { ECSEachWithEntitiesJob } from '../../threads/jobs/ecs-each-with-entities';
import { ParallelJob, JobArgs } from '../../threads/jobs/job';

import { SystemQueryBase } from './system-query-base';

/**
 * Provides a mechanism for iterating and invoking a lambda expression on the {@link component components} and {@link Entity entities} selected by a {@link System.query query}.
 *
 * @remarks
 * The iterator callbacks are passed an {@link Entity} and their {@link component} instances. If {@link Entity} is not needed - use {@link SystemQuery} instead.
 *
 * @see
 * {@link SystemQuery}
 *
 * @example
 * ```ts
 * @injectable()
 * class DestroyDamageables extends System {
 * 	// ...
 *
 * 	public override async update() {
 * 		await this.damageables
 * 			.withEntities()
 * 			.each([read(Health)], (entity, [health]) => {
 * 				if(health.currentHealth <= 0) {
 * 					this.world.destroy(entity);
 * 				}
 * 			})
 * 			.run();
 * 	}
 * }
 * ```
 */
export class SystemQueryWithEntities<
	TAll extends ComponentTypes,
	TSome extends ComponentTypes = [],
	TNone extends ComponentTypes = []
> extends SystemQueryBase<TAll, TSome, TNone> {
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
	 * @param lambda Callback to be called on each {@link Entity} and its {@link component} instances
	 *
	 * @example
	 * ```ts
	 * @injectable()
	 * class DestroyDamageables extends System {
	 * 	// ...
	 *
	 * 	public override async update() {
	 * 		// run on main thread since we are accessing main thread APIs (this.world.destroy)
	 * 		await this.damageables
	 * 			.withEntities()
	 * 			.each([read(Health)], (entity, [health]) => {
	 * 				if(health.currentHealth <= 0) {
	 * 					this.world.destroy(entity);
	 * 				}
	 * 			})
	 * 			.run();
	 * 	}
	 * }
	 * ```
	 */
	public each<T extends ComponentTypesQuery>(
		componentAccessDescriptors: T,
		lambda: EntityEachLambdaWithEntities<T, TAll, TSome, TNone, undefined>
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
	 * class DestroyDamageables extends System {
	 * 	// ...
	 *
	 * 	public override async update() {
	 * 		// schedule on parallel threads since world is passed as parameter to background threads
	 * 		this.damageables
	 * 			.withEntities()
	 * 			.each([read(Health)], [this.world], (entity, [health], [world]) => {
	 * 				if(health.currentHealth <= 0) {
	 * 					world.destroy(entity);
	 * 				}
	 * 			})
	 * 			.scheduleParallel();
	 * 	}
	 * }
	 * ```
	 */
	public each<T extends ComponentTypesQuery, P extends JobArgs>(
		componentAccessDescriptors: T,
		params: P,
		lambda: EntityEachLambdaWithEntities<T, TAll, TSome, TNone, P>
	): ParallelJob;
	public each<T extends ComponentTypesQuery, P extends JobArgs>(
		componentAccessDescriptors: T,
		params: P | EntityEachLambdaWithEntities<T, TAll, TSome, TNone, undefined>,
		lambda?: EntityEachLambdaWithEntities<T, TAll, TSome, TNone, P>
	): ParallelJob {
		if (typeof params === 'function') {
			return new ECSEachWithEntitiesJob<T, TAll, TSome, TNone>(
				this.system,
				this.query,
				componentAccessDescriptors,
				params,
				undefined,
				this.withChanges
			);
		} else {
			return new ECSEachWithEntitiesJob<T, TAll, TSome, TNone>(
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
