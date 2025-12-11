import { relations } from 'drizzle-orm';
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const phrases = pgTable(
  'phrases',
  {
    id: varchar('id', { length: 21 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    content: text('content').notNull(),
    source: text('source').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('phrases_created_at_idx').on(table.createdAt)]
);

export const profiles = pgTable(
  'profiles',
  {
    id: varchar('id', { length: 21 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    discordId: varchar('discord_id', { length: 19 }).unique().notNull(),
    nickname: text('nickname'),
    bio: text('bio'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('profiles_discord_id_idx').on(table.discordId),
    index('profiles_created_at_idx').on(table.createdAt),
  ]
);

export const profilesRelations = relations(profiles, ({ many }) => ({
  socials: many(socials),
  feedbacks: many(feedbacks),
}));

export const socials = pgTable(
  'socials',
  {
    id: varchar('id', { length: 21 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    profileId: varchar('profile_id', { length: 21 })
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    url: text('url').notNull(),
  },
  (table) => [
    index('socials_profile_id_idx').on(table.profileId),
    index('socials_name_idx').on(table.name),
  ]
);

export const socialsRelations = relations(socials, ({ one }) => ({
  profile: one(profiles, {
    fields: [socials.profileId],
    references: [profiles.id],
  }),
}));

export const feedbackStatusEnum = pgEnum('feedback_status', [
  'OPEN',
  'ACKNOWLEDGED',
  'CLOSED',
  'RESOLVED',
  'ACCEPTED',
  'REJECTED',
]);

export const feedbacks = pgTable(
  'feedbacks',
  {
    id: varchar('id', { length: 21 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    profileId: varchar('profile_id', { length: 21 })
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    status: feedbackStatusEnum('status').default('OPEN').notNull(),
    response: text('response'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('feedbacks_profile_id_idx').on(table.profileId),
    index('feedbacks_status_idx').on(table.status),
    index('feedbacks_created_at_idx').on(table.createdAt),
  ]
);

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  profile: one(profiles, {
    fields: [feedbacks.profileId],
    references: [profiles.id],
  }),
}));
