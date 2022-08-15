/**
 * Represents a generic type or null value
 * @typeParam T - Generic type. Can be any
 */
export type Nullable<T> = T | null;
/**
 * Represents a constructor of a given type
 * @typeParam T - The type
 *
 */
export type ClassType<T = any> = any & (new (...args: any[]) => T);
/**
 * Type, containing a prototype of a given generic, but without a constuctor
 * @typeParam T - The generic type
 */
export type Abstract<T> = any & { prototype: T };
/**
 * Instance of a type
 * @typeParam T - The type
 */
export type Instance<T extends any> = T;
/**
 * Utility type removing mutating properties from an array (only from type checker).
 * Similar to ReadonlyArray, but allows setting of indexes in the array.
 * @typeParam T - The array
 */
export type FixedLengthArray<T extends any[] = any[]> = Exclude<T, ['push', 'pop', 'shift', 'splice']>;
/**
 * Utility type checking whether a value is contained in an array
 * @typeParam X - The value
 * @typeParam A - The array
 *
 * @example
 * ```ts
 * const a: InArray<3, [2, 3, -1]> = true; // ok
 * const b: InArray<4, [1, 2, 3]> = true; // Type 'true' is not assignable to type 'false'
 * ```
 */
export type InArray<X, A extends readonly unknown[]> = X extends A[number] ? true : false;
/**
 * Utility type for checking whether an array has only unique values
 * @typeParam A - The array
 *
 * @example
 * ```ts
 * const a: IsUniqueArray<[1, 2, 3]> = true; // ok
 * const b: IsUniqueArray<[2, 2, 3]> = true; // type boolean is not assignable to type [never, "Encountered value with duplicates:", 2]
 * ```
 */
export type IsUniqueArray<A extends readonly unknown[]> = A extends readonly [infer X, ...infer Rest]
	? X extends Rest[number]
		? [never, 'Encountered value with duplicates:', X] // false
		: IsUniqueArray<Rest>
	: true;

/**
 * Interface representing a disposable object.
 */
export interface Disposable {
	/** Indicates whether disposable object has been disposed of */
	readonly isDisposed: boolean;
	/** Disposes of the object (sync or async) */
	dispose(): void | Promise<void>;
}
