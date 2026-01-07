import { Events, type Message } from 'discord.js';
import { trackMessage } from 'redis/telemetry';
import { fireAndForget } from 'utils/async';
import type { EventInfer } from '~/types/event';

export const event = <EventInfer>{
  name: Events.MessageCreate,
  execute: (message: Message) => {
    if (message.author.bot) return;
    fireAndForget(() =>
      trackMessage(message.author.id, message.guild?.id || undefined),
    );
  },
};
