import type z from 'zod';
import type { phraseCreateSchema } from './validations';
import type { feedbackStatusEnum, phrases } from './schema';

export type PhraseCreate = z.infer<typeof phraseCreateSchema>;

export type FeedbackStatus = (typeof feedbackStatusEnum.enumValues)[number];

export type Phrase = typeof phrases.$inferSelect;
