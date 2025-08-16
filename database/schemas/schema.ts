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
    discord_id: t.varchar({ length: 19 }).notNull().unique(),
    nickname: t.text(),
    bio: t.text(),
    created_at: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [t.uniqueIndex('discord_id_idx').on(table.discord_id)]
);
export type User = typeof users.$inferSelect;

export const userRelations = relations(users, ({ many }) => ({
  socials: many(socialsLinks),
  feedbacks: many(feedbacks),
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

export const feedbackStatuses = t.pgEnum('feedback_statuses', [
  'open',
  'acknowledged',
  'closed',
  'resolved',
  'accepted',
  'rejected',
]);

export const feedbacks = t.pgTable('feedbacks', {
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: t
    .integer()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: t.text().notNull(),
  content: t.text().notNull(),
  status: feedbackStatuses().notNull().default('open'),
  response: t.text(),
  created_at: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  user: one(users, {
    fields: [feedbacks.user_id],
    references: [users.id],
  }),
}));
