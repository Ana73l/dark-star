import { Entity } from '../../entity';
import { ComponentTypes, QueryRecord } from '../../query';

import { System } from '../planning/__internals__';

/**
 * Provides a mechanism for iterating and invoking a lambda expression on each {@link Entity} selected by a {@link System.query query}.
 */
export abstract class SystemQueryBase<TAll extends ComponentTypes, TSome extends ComponentTypes = [], TNone extends ComponentTypes = []> {
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
	 * @param withChanges - Only include chunks that have been written to since last {@link System system} update.
	 */
	constructor(protected system: System, protected query: QueryRecord, protected withChanges: boolean = false) {}

	/**
	 * Include only chunks that have been written to since last {@link System system} update.
	 *
	 * @returns The SystemQuery instance
	 */
	public withChangedFilter(): SystemQueryBase<TAll, TSome, TNone> {
		this.withChanges = true;

		return this;
	}
}
