import * as t from 'drizzle-orm/pg-core';

export const phrases = t.pgTable('phrases', {
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  content: t.text().notNull(),
  source: t.text().notNull(),
});
