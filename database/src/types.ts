import type { FeedbackStatus, PhraseCreate } from './validations';
import type { phrases } from './schema';

export type PhraseCreateInfer = typeof PhraseCreate.infer;

export type FeedbackStatusInfer = typeof FeedbackStatus.infer;

export type Phrase = typeof phrases.$inferSelect;
