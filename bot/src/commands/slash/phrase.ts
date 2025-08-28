import db from 'database';
import { ComponentType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { sql } from 'drizzle-orm';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';
import config from '~/config';

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('phrase')
    .setDescription('Get a random phrase'),
  async execute(intr) {
    await intr.deferReply();

    const phrase = await db.query.phrases.findFirst({
      columns: { id: false },
      orderBy: sql`RANDOM()`,
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
              content: `> ${phrase.content}`,
            },
          ],
        },
      ],
    });
  },
};
