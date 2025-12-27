import { or, sql, type SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { db } from '.';
import { fromAsyncThrowable, type ResultAsync } from 'neverthrow';

export function testConnection(): ResultAsync<number, string> {
  const start = performance.now();
  const result = fromAsyncThrowable(
    () => db.execute(sql`SELECT 1`),
    (e) => (e instanceof Error ? e.message : 'Failed to connect to database')
  )();
  // Use a map instead of using the value directly to keep the original error
  return result.map(() => performance.now() - start);
}

export function conditionsToWhere(
  conditions: (SQL | undefined)[]
): SQL | undefined {
  const filtered = conditions.filter((c): c is SQL => c !== undefined);
  if (filtered.length === 0) return undefined;
  if (filtered.length === 1) return filtered[0];
  return or(...filtered);
}

export const exists = async (
  table: PgTable,
  where: SQL | undefined
): Promise<boolean> =>
  fromAsyncThrowable(() =>
    db
      .select({ _: sql`1` })
      .from(table)
      .where(where)
      .limit(1)
  )()
    .map((result) => result.length > 0)
    // If there's an error, we couldn't reach the database
    // It's a very edge case, so for the sake of usability and security, we return false
    // It'll definitely come back to hunt me down later, but Sentry should catch it
    .unwrapOr(false);
