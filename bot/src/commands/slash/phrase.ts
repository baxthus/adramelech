import { ComponentType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';
import config from '~/config';
import { prisma } from 'database';
import { getRandomIndex } from 'database/utils';

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('phrase')
    .setDescription('Get a random phrase'),
  async execute(intr) {
    await intr.deferReply();

    const phrase = await prisma.phrase.findFirst({
      omit: { id: true },
      skip: getRandomIndex(await prisma.phrase.count()),
    });
    if (!phrase) return sendError(intr, 'No phrase found in the database');

    await intr.followUp({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: config.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: `\`\`\`${phrase.content}\`\`\``,
            },
            {
              type: ComponentType.TextDisplay,
              content: `> ${phrase.source}`,
            },
          ],
        },
      ],
    });
  },
};
