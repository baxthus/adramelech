import z from 'zod';
import { customId } from './customId';
import type { Precondition } from './precondition';
import type { ModalSubmitInteraction } from 'discord.js';

export const modalSchema = z.object({
  customId: customId,
  cooldown: z.union([z.number(), z.boolean()]).optional(),
  preconditions: z.array(z.custom<Precondition>()).optional(),
  execute: z.function({
    input: [z.custom<ModalSubmitInteraction>()],
    output: z.promise(z.void()),
  }),
});
export type Modal = z.infer<typeof modalSchema>;
