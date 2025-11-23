export function conditionsToWhere<T>(
  conditions: T[]
): T | { OR: T[] } | undefined {
  return conditions.length === 0
    ? undefined
    : conditions.length === 1
      ? conditions[0]
      : { OR: conditions };
}

export function getRandomIndex(count: number): number {
  if (count <= 0) return -1;
  return Math.floor(Math.random() * count);
}
