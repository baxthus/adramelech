import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { loadModules } from '#bot/loader';
import type { Command } from '#bot/types/command';
import type { Modal } from '#bot/types/modal';
import env from '#env';
import type { Component } from '#bot/types/component';
import registerCommands from '#bot/utils/registerCommands';
import logger from '~/logger';

export class CustomClient extends Client {
  commands: Collection<string, Command> = new Collection();
  events: Collection<string, Event> = new Collection();
  components: Collection<string, Component> = new Collection();
  modals: Collection<string, Modal> = new Collection();
  cooldowns: Collection<string, Collection<string, number>> = new Collection();
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
        type: env.PRESENCE_TYPE,
        name: env.PRESENCE_NAME,
      },
    ],
  },
});

await loadModules(client);

if (client.commands.size > 0) await registerCommands(client);
else logger.warn('No commands found. Skipping command registration');

await client.login(env.BOT_TOKEN);
