/**
 * Class decorator marking a target as injectable.
 * Allows the target to be injected and to be injected to.
 *
 * @returns {ClassDecorator}
 *
 * @example
 * ```ts
 * @injectable()
 * class UserService {
 * 	// ...
 * }
 * ```
 */
export const injectable: () => ClassDecorator =
	() =>
	<T extends Function>(target: T): T =>
		target;
