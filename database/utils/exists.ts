import type { PgTableWithColumns, TableConfig } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import db from '..';

export default async function exists<T extends TableConfig>(
  table: PgTableWithColumns<T>,
  filter?: SQL<unknown>
): Promise<boolean> {
  return (await db.$count(table, filter)) > 0;
}
