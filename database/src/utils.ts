import { or, sql, type SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { db } from '.';

export function conditionsToWhere(
  conditions: (SQL | undefined)[]
): SQL | undefined {
  const filtered = conditions.filter((c): c is SQL => c !== undefined);
  if (filtered.length === 0) return undefined;
  if (filtered.length === 1) return filtered[0];
  return or(...filtered);
}

export async function exists(
  table: PgTable,
  where: SQL | undefined
): Promise<boolean> {
  const result = await db
    .select({ _: sql`1` })
    .from(table)
    .where(where)
    .limit(1);

  return result.length > 0;
}
