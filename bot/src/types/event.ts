import type { Client, Events, Interaction } from 'discord.js';
import z from 'zod';

export const eventSchema = z.object({
  name: z.custom<Events>(),
  once: z.boolean().optional(),
  execute: z.function({
    input: [z.custom<Client | Interaction>()],
    output: z.promise(z.void()),
  }),
});
export type Event = z.infer<typeof eventSchema>;
