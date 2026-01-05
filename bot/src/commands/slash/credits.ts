import {
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { CustomClient } from '~/index';
import UnicodeSheet from '~/tools/UnicodeSheet';
import type { CommandInfer } from '~/types/command';
import { sendError } from '~/utils/sendError';
import config from '~/config';
import { fromThrowable } from 'neverthrow';

export const command = <CommandInfer>{
  data: new SlashCommandBuilder()
    .setName('credits')
    .setDescription('List of all external APIs used by the bot')
    .addBooleanOption((option) =>
      option
        .setName('separate-rows')
        .setDescription('Whether to separate each API into its own row'),
    ),
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    const separateRows = intr.options.getBoolean('separate-rows') ?? false;
    const client = intr.client as CustomClient;

    const credits = client.commands
      .filter((cmd) => cmd.uses && cmd.uses.length > 0)
      .map((cmd) => ({
        name: cmd.data.name,
        uses: cmd.uses!.join('; '),
      }));

    const result = fromThrowable(
      () =>
        new UnicodeSheet(separateRows)
          .addColumn(
            'Command',
            credits.map((c) => c.name),
          )
          .addColumn(
            'Uses',
            credits.map((cmd) => cmd.uses),
          )
          .build(),
      (e) => `Failed to build the credits table:\n${String(e)}`,
    )();
    if (result.isErr()) return await sendError(intr, result.error);

    await intr.followUp({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: config.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: '# Credits',
            },
            {
              type: ComponentType.File,
              file: {
                url: 'attachment://credits.txt',
              },
            },
          ],
        },
      ],
      files: [
        {
          attachment: Buffer.from(result.value),
          name: 'credits.txt',
        },
      ],
    });
  },
};
