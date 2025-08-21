import { REST, Routes } from 'discord.js';
import type { CustomClient } from '~';
import config from '~/config';
import logger from '~/logger';

export default async function registerCommands(client: CustomClient) {
  const commands = client.commands.map((command) => command.data.toJSON());
  const rest = new REST().setToken(config.BOT_TOKEN);

  try {
    const data = (await rest.put(Routes.applicationCommands(config.BOT_ID), {
      body: commands,
    })) as unknown[];

    logger.success(`${data.length} commands registered`);
  } catch (error) {
    logger.error('Error refreshing application commands', error);
    throw error;
  }
}
