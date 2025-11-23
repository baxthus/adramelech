import z from 'zod';
import { FeedbackStatus } from './generated/prisma/enums';

export const phraseCreateSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  source: z.string().min(1, 'Source cannot be empty'),
});
export type PhraseCreate = z.infer<typeof phraseCreateSchema>;

export const feedbackStatusSchema = z.enum(Object.values(FeedbackStatus));
