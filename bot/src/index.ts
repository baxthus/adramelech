import "~/instrument"; // Sentry, import this first

import "#db"; // Preload
import { Client, Collection, GatewayIntentBits } from "discord.js";
import type { Command } from "~/types/command";
import type { Event } from "~/types/event";
import type { Component } from "~/types/component";
import type { Modal } from "~/types/modal";
import config from "~/config";
import { loadModules } from "~/loader";
import registerCommands from "~/utils/registerCommands";
import logger from "~/logger";

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
        type: config.PRESENCE_TYPE,
        name: config.PRESENCE_NAME,
      },
    ],
  },
});

await loadModules(client);

if (client.commands.size > 0) await registerCommands(client);
else logger.warn("No commands found. Skipping command refreshing");

await client.login(config.BOT_TOKEN);
