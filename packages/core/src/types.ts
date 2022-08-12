export type Nullable<T> = T | null;
export type ClassType<T = any> = any & (new (...args: any[]) => T);
export type Abstract<T> = any & { prototype: T };
export type Instance<T extends any> = T;
export type FixedLengthArray<T extends any[] = any[]> = Exclude<
  T,
  ['push', 'pop', 'shift', 'splice']
>;

export type InArray<X, A extends readonly unknown[]> = X extends A[number]
  ? true
  : false;
export type IsUniqueArray<A extends readonly unknown[]> = A extends readonly [
  infer X,
  ...infer Rest
]
  ? X extends Rest[number]
    ? [never, 'Encountered value with duplicates:', X] // false
    : IsUniqueArray<Rest>
  : true;

export interface Disposable {
  readonly isDisposed: boolean;
  dispose(): void | Promise<void>;
}
