import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { UIBuilder } from '~/services/UIBuilder';
import type { CommandInfer } from '~/types/command';

export const command = <CommandInfer>{
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Roll a dice')
    .addIntegerOption((option) =>
      option
        .setName('sides')
        .setDescription('Number of sides. Default is 6')
        .setMinValue(2)
        .setMaxValue(100),
    ),
  async execute(intr: ChatInputCommandInteraction) {
    const sides = intr.options.getInteger('sides') ?? 6;
    const result = Math.floor(Math.random() * sides) + 1;

    await intr.reply(
      UIBuilder.createGenericSuccess(
        `# You rolled a ${result} on a ${sides}-sided dice`,
        false,
      ),
    );
  },
};
