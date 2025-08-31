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
    const match = z.url().safeParse(url);
    if (!match.success) return await sendError(intr, 'Invalid URL');

    const response = await ky
      .get(`https://is.gd/create.php?format=simple&url=${url}`)
      .text();
    if (!response || response.startsWith('Error'))
      return await sendError(intr, 'Failed to shorten URL');

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
              \`\`\`${response}\`\`\`
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
