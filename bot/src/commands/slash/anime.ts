import {
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type TextChannel,
} from 'discord.js';
import ky from 'ky';
import z from 'zod';
import {
  executeCommandFromTree,
  type Command,
  type CommandGroupExecutors,
} from '~/types/command';
import { sendError } from '~/utils/sendError';
import config from '~/config';
import StringBuilder from '~/tools/StringBuilder';
import { fromAsyncThrowable, okAsync, errAsync } from 'neverthrow';

enum AnimeImageAgeRating {
  Safe = 'safe',
  Suggestive = 'suggestive',
  Borderline = 'borderline',
  Explicit = 'explicit',
}

const animeImageSchema = z
  .array(
    z.object({
      url: z.url(),
      source_url: z.url().nullish(),
    }),
  )
  .length(1);

const nekoImageSchema = z.object({
  url: z.url(),
});

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('anime')
    .setDescription('Anime related commands')
    .addSubcommandGroup((group) =>
      group
        .setName('media')
        .setDescription('Anime media commands')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('image')
            .setDescription('Get a random anime image')
            .addStringOption((option) =>
              option
                .setName('rating')
                .setDescription('The rating of the image')
                .setChoices(
                  Object.entries(AnimeImageAgeRating).map(([key, value]) => ({
                    name: key,
                    value,
                  })),
                ),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName('neko').setDescription('Get a random neko image'),
        ),
    ),
  cooldown: true,
  uses: ['nekosapi.com', 'nekos.life'],
  execute: async (intr: ChatInputCommandInteraction) =>
    executeCommandFromTree(executors, intr),
};

const executors: CommandGroupExecutors = {
  media: {
    image: animeImage,
    neko: nekoImage,
  },
};

async function animeImage(intr: ChatInputCommandInteraction) {
  await intr.deferReply();

  const rating =
    intr.options.getString('rating', false) ?? AnimeImageAgeRating.Safe;
  if (
    !Object.values(AnimeImageAgeRating).includes(rating as AnimeImageAgeRating)
  )
    return await sendError(intr, 'Invalid rating');

  if (
    !(intr.channel as TextChannel).nsfw &&
    ['borderline', 'explicit'].includes(rating)
  )
    return await sendError(
      intr,
      'This command can only be used in NSFW channels',
    );

  const result = await fromAsyncThrowable(
    ky.get('https://api.nekosapi.com/v4/images/random', {
      searchParams: {
        rating,
        limit: 1,
      },
      headers: {
        'User-Agent': config.USER_AGENT,
      },
    }).json,
    (e) => `Failed to fetch image:\n${String(e)}`,
  )().andThen((response) => {
    const parsed = animeImageSchema.safeParse(response);
    return parsed.success
      ? okAsync(parsed.data)
      : errAsync(parsed.error.message);
  });
  if (result.isErr()) return await sendError(intr, result.error);

  const footer = new StringBuilder();
  if (result.value[0]?.source_url)
    footer.appendLine(`> Source: ${result.value[0].source_url}`);
  footer.append(`> Powered by NekosAPI`);

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
            content: footer.toString(),
          },
        ],
      },
    ],
  });
}

async function nekoImage(intr: ChatInputCommandInteraction) {
  await intr.deferReply();

  const result = await fromAsyncThrowable(
    ky.get('https://nekos.life/api/v2/img/neko').json,
    (e) => `Failed to fetch image:\n${String(e)}`,
  )().andThen((response) => {
    const parsed = nekoImageSchema.safeParse(response);
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
                  url: result.value.url,
                },
              },
            ],
          },
          {
            type: ComponentType.TextDisplay,
            content: '> Powered by nekos.life',
          },
        ],
      },
    ],
  });
}
