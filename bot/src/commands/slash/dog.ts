import { ComponentType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import ky from 'ky';
import type { CommandInfer } from '~/types/command';
import config from '~/config';
import { sendError } from '~/utils/sendError';
import { fromAsyncThrowable } from 'neverthrow';
import { type } from 'arktype';
import { arkToResult } from 'utils/validation';

const DogImage = type({
  status: '"success"',
  message: 'string.url',
});

export const command = <CommandInfer>{
  data: new SlashCommandBuilder()
    .setName('dog')
    .setDescription('Get a random dog image'),
  uses: ['dog.ceo'],
  cooldown: true,
  async execute(intr) {
    await intr.deferReply();

    const result = await fromAsyncThrowable(
      ky.get('https://dog.ceo/api/breeds/image/random').json,
      (e) => `Failed to fetch dog image:\n${String(e)}`,
    )().andThen(arkToResult(DogImage));
    if (result.isErr()) return await sendError(intr, result.error);

    await intr.followUp({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: config.EMBED_COLOR,
          components: [
            {
              type: ComponentType.MediaGallery,
              items: [
                {
                  media: {
                    url: result.value.message,
                  },
                },
              ],
            },
            {
              type: ComponentType.TextDisplay,
              content: '> Powered by dog.ceo',
            },
          ],
        },
      ],
    });
  },
};
