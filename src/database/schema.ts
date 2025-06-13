import { relations } from 'drizzle-orm';
import * as t from 'drizzle-orm/pg-core';

export const phrases = t.pgTable('phrases', {
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  content: t.text().notNull(),
  source: t.text().notNull(),
});

export const users = t.pgTable(
  'users',
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    discord_id: t.varchar({ length: 18 }).notNull().unique(), // Discord user ID
    nickname: t.text(),
    bio: t.text(),
    created_at: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [t.uniqueIndex('discord_id_idx').on(table.discord_id)]
);
export type User = typeof users.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  socials: many(socialsLinks),
}));

export const socialsLinks = t.pgTable('socials_links', {
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: t
    .integer()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: t.text().notNull(),
  url: t.text().notNull(),
});

export const socialsLinksRelations = relations(socialsLinks, ({ one }) => ({
  user: one(users, {
    fields: [socialsLinks.user_id],
    references: [users.id],
  }),
}));
