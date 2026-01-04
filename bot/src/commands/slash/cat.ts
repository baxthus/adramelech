import z from 'zod';
import type { Command } from '~/types/command.ts';
import { ComponentType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import ky from 'ky';
import { sendError } from '~/utils/sendError.ts';
import config from '~/config.ts';
import { errAsync, fromAsyncThrowable, okAsync } from 'neverthrow';

const schema = z
  .array(
    z.object({
      url: z.url(),
    }),
  )
  .length(1);

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('cat')
    .setDescription('Get a random cat image'),
  cooldown: true,
  uses: ['thecatapi.com'],
  async execute(intr) {
    await intr.deferReply();

    const result = await fromAsyncThrowable(
      ky('https://api.thecatapi.com/v1/images/search').json,
      (e) => `Failed to fetch the cat image:\n${String(e)}`,
    )().andThen((response) => {
      const parsed = schema.safeParse(response);
      return parsed.success
        ? okAsync(parsed.data)
        : errAsync(parsed.error.message);
    });
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
                    url: result.value[0]!.url,
                  },
                },
              ],
            },
            {
              type: ComponentType.TextDisplay,
              content: '> Powered by thecatapi.com',
            },
          ],
        },
      ],
    });
  },
};
