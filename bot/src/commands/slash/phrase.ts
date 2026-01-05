import { ComponentType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { CommandInfer } from '~/types/command';
import { sendError } from '~/utils/sendError';
import config from '~/config';
import { db } from 'database';
import { phrases } from 'database/schema';
import { sql } from 'drizzle-orm';

export const command = <CommandInfer>{
  data: new SlashCommandBuilder()
    .setName('phrase')
    .setDescription('Get a random phrase'),
  async execute(intr) {
    await intr.deferReply();

    const result = await db
      .select()
      .from(phrases)
      .orderBy(sql`RANDOM()`)
      .limit(1);
    const phrase = result[0];
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
