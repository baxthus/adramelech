import {
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import ky from 'ky';
import z from 'zod';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';
import config from '~/config';
import { stripIndents } from 'common-tags';
import { errAsync, fromAsyncThrowable, okAsync } from 'neverthrow';

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('short')
    .setDescription('Shorten a URL')
    .addStringOption((option) =>
      option
        .setName('url')
        .setDescription('The URL to shorten')
        .setRequired(true),
    ),
  cooldown: true,
  uses: ['is.gd'],
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    const url = intr.options.getString('url', true);
    if (!z.url().safeParse(url).success)
      return await sendError(intr, 'Invalid URL');

    const result = await fromAsyncThrowable(
      ky.get('https://is.gd/create.php', {
        searchParams: {
          format: 'simple',
          url: url,
        },
      }).text,
      (e) => `Failed to shorten URL: ${e}`,
    )().andThen((response) =>
      !response || response.startsWith('Error')
        ? errAsync('Failed to shorten URL')
        : okAsync(response),
    );
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
              content: stripIndents`
              ### :outbox_tray: Original URL
              \`\`\`${url}\`\`\`
              `,
            },
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
              ### :inbox_tray: Shortened URL
              \`\`\`${result.value}\`\`\`
              `,
            },
            {
              type: ComponentType.TextDisplay,
              content: '> Powered by is.gd',
            },
          ],
        },
      ],
    });
  },
};
