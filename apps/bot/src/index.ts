import '~/instrument'; // Sentry, import this first

import '@repo/database'; // Preload
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import config from '~/config';
import { loadModules } from '~/loader';
import logger from '~/logger';
import type { CommandInfer } from '~/types/command';
import type { ComponentInfer } from '~/types/component';
import type { EventInfer } from '~/types/event';
import type { ModalInfer } from '~/types/modal';
import registerCommands from '~/utils/registerCommands';

export class CustomClient extends Client {
  commands: Collection<string, CommandInfer> = new Collection();
  events: Collection<string, EventInfer> = new Collection();
  components: Collection<string, ComponentInfer> = new Collection();
  modals: Collection<string, ModalInfer> = new Collection();
}

export const client = new CustomClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  presence: {
    activities: [
      {
        type: config.PRESENCE_TYPE,
        name: config.PRESENCE_NAME,
      },
    ],
  },
});

await loadModules(client);

if (client.commands.size > 0) await registerCommands(client);
else logger.warn('No commands found. Skipping command refreshing');

await client.login(config.BOT_TOKEN);
