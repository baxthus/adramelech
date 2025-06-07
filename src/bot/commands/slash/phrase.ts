import { ComponentType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import env from '#env';
import type { Command } from '#bot/types/command';
import loadPhrases from '#bot/utils/loadPhrases';

const phrases = await loadPhrases();

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('phrase')
    .setDescription('Get a random phrase'),
  async execute(interaction) {
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    await interaction.reply({
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
