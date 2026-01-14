import { type } from 'arktype';
import {
  Events,
  type Message,
  type Client,
  type Interaction,
} from 'discord.js';

type UnifiedEvent = Client | Interaction | Message;

export const Event = type({
  name: type.valueOf(Events),
  once: 'boolean?',
  execute: type('Function').as<(arg: UnifiedEvent) => Promise<void>>(),
});
export type EventInfer = typeof Event.infer;
