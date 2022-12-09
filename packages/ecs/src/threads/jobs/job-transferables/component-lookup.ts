import { Entity } from '../../../entity';
import { ComponentType } from '../../../component';
import { ComponentAccessFlags, QueryRecord } from '../../../query';

export const $query = Symbol('dark_star_ecs_query');
export const $accessFlag = Symbol('dark_star_ecs_access_flag');
export const $componentType = Symbol('dark_star_ecs_component_type');

export class ComponentLookup<T extends ComponentType = ComponentType, R extends boolean = false> {
	/**
	 * @internal
	 * ComponentLookup should not be initialized directly by consumers of the library.
	 */
	constructor(type: T, query: QueryRecord, readonly?: R) {
		this[$componentType] = type;
		this[$query] = query;
		this[$accessFlag] = readonly ? ComponentAccessFlags.Read : ComponentAccessFlags.Write;
	}

	/**
	 * Key-value pairs representing {@link Entity entities} and their {@link ComponentType component} instance.
	 */
	[entity: Entity]: R extends true ? Readonly<InstanceType<T>> : InstanceType<T>;

	/**
	 * @internal
	 * {@link ComponentType Component type} to be looked up.
	 *
	 * @remarks
	 * Used internally during serializing for/ deserializing on background threads.
	 */
	[$componentType]: T;
	/**
	 * @internal
	 * {@link QueryRecord} from which {@link ComponentType components} of given type will be retrieved.
	 */
	[$query]: QueryRecord;
	/**
	 * @internal
	 * Used internally to prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 */
	[$accessFlag]: ComponentAccessFlags;
}
