import {
  ChatInputCommandInteraction,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import env from '#env';
import type { Command } from '#bot/types/command';
import db from '#db';
import { sendError } from '~/bot/utils/sendError';
import { sql } from 'drizzle-orm';

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('phrase')
    .setDescription('Get a random phrase'),
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    const phrase = await db.query.phrases.findFirst({
      columns: {
        content: true,
        source: true,
      },
      orderBy: sql`RANDOM()`,
    });
    if (!phrase) return sendError(intr, 'No phrases found in the database');

    await intr.followUp({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
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
