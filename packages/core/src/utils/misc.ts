/**
 * @constant
 * Uint32 maximum value
 */
export const UINT32_MAX = 4294967295;

/**
 * Creates an unique integer id generator.
 *
 * @param {number} [start=1] - Initial value
 * @returns {number | null}
 *
 * @example
 * ```ts
 * // without initial value
 * let uid = createUIDGenerator();
 *
 * console.log(uid(), uid()); // 1 2
 *
 * // with initial value
 * uid = createUIDGenerator(5);
 *
 * console.log(uid(), uid()); // 5 6
 * ```
 * @remarks
 * Generates unique integers up to {@link UINT32_MAX}.
 * Further calls return null once the maximum value has been reached.
 */
export const createUIDGenerator = (start: number = 1) => {
	let current = start;

	return () => (current < UINT32_MAX ? current++ : null);
};

/**
 * Asserts a logical expression and throws an error if expression is false
 * @param {boolean} expression - Logical expression that evaluates to true or false
 * @param {string} [message=''] - Error message to be displayed if expression evaluates to false
 *
 * @example
 * ```ts
 * assert(1 === 2); // Uncaught Error
 * assert(1 === 2, 'Custom error message'); // Uncaught Error: Custom error message
 * ```
 */
export function assert(expression: boolean, message: string = ''): asserts expression {
	if (!expression) {
		throw new Error(message);
	}
}
