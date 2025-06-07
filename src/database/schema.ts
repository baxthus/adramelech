import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const configSchema = sqliteTable('config', {
  key: text().primaryKey(),
  value: text().notNull(),
});
