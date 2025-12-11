import z from 'zod';
import { feedbackStatusEnum } from './schema';

export const phraseCreateSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  source: z.string().min(1, 'Source cannot be empty'),
});

export const feedbackStatusSchema = z.enum(feedbackStatusEnum.enumValues);
