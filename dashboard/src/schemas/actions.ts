import z from 'zod';

export const defaultGetActionsSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
});
