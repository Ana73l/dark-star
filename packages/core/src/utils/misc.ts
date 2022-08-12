export const UINT32_MAX = 4294967295;

export const createUIDGenerator = (start: number = 1) => {
  let current = start;

  return () => (current < UINT32_MAX ? current++ : null);
};

export function assert(
  expression: boolean,
  message: string = ''
): asserts expression {
  if (!expression) {
    throw new Error(message);
  }
}
