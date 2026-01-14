import { REST, Routes } from 'discord.js';
import { fromAsyncThrowable } from 'neverthrow';
import type { CustomClient } from '~';
import config from '~/config';
import logger from '~/logger';

export default async function registerCommands(client: CustomClient) {
  const commands = client.commands.map((command) => command.data.toJSON());
  const rest = new REST().setToken(config.BOT_TOKEN);

  const result = await fromAsyncThrowable(() =>
    rest.put(Routes.applicationCommands(config.BOT_ID), {
      body: commands,
    }),
  )().map((r) => r as unknown[]);
  if (result.isErr()) {
    logger.error('Error refreshing application commands', result.error);
    process.exit(1);
  }

  logger.success(`${result.value.length} commands registered`);
}
