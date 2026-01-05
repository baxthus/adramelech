import { type } from 'arktype';
import { Events, type Client, type Interaction } from 'discord.js';

export const Event = type({
  name: type.valueOf(Events),
  once: 'boolean?',
  execute: type('Function').as<(arg: Client | Interaction) => Promise<void>>(),
});
export type EventInfer = typeof Event.infer;
