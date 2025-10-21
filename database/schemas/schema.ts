import { relations } from 'drizzle-orm';
import * as t from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

export const phrases = t.pgTable('phrases', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  content: t.text('content').notNull(),
  source: t.text('source').notNull(),
  createdAt: t
    .timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const phraseInsertSchema = createInsertSchema(phrases);
export type PhraseInsert = typeof phrases.$inferInsert;

export const profiles = t.pgTable(
  'profiles',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    discordId: t.varchar('discord_id', { length: 19 }).notNull().unique(),
    nickname: t.text('nickname'),
    bio: t.text('bio'),
    createdAt: t
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [t.uniqueIndex('profiles_discord_id_idx').on(table.discordId)]
);
export type Profile = typeof profiles.$inferSelect;

export const profilesRelations = relations(profiles, ({ many }) => ({
  socials: many(socials),
  feedbacks: many(feedbacks),
}));

export const socials = t.pgTable('socials', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  profileId: t
    .uuid('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: t.text('name').notNull(),
  url: t.text('url').notNull(),
});

export const socialsRelations = relations(socials, ({ one }) => ({
  profile: one(profiles, {
    fields: [socials.profileId],
    references: [profiles.id],
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
export type FeedbackStatus = (typeof feedbackStatuses.enumValues)[number];

export const feedbacks = t.pgTable('feedbacks', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  profileId: t
    .uuid('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  title: t.text('title').notNull(),
  content: t.text('content').notNull(),
  status: feedbackStatuses('status').notNull().default('open'),
  response: t.text('response'),
  createdAt: t
    .timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: t
    .timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  profile: one(profiles, {
    fields: [feedbacks.profileId],
    references: [profiles.id],
  }),
}));
