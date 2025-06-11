import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const phrases = pgTable('phrases', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  content: text().notNull(),
  source: text().notNull(),
  created_at: timestamp().notNull().defaultNow(),
  // No updated_at because phrases are not meant to be edited
});
