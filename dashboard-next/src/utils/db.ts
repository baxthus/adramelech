import { or, type SQL } from 'drizzle-orm';

export function conditionsToFilter(conditions: SQL[]): SQL | undefined {
  return conditions.length === 0
    ? undefined
    : conditions.length === 1
      ? conditions[0]
      : or(...conditions);
}
