import z from 'zod';
import type { Command } from '~/types/command.ts';
import {
  ButtonStyle,
  type ChatInputCommandInteraction,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { sendError } from '~/utils/sendError.ts';
import ky from 'ky';
import { errAsync, fromAsyncThrowable, okAsync } from 'neverthrow';
import config from '~/config';
import { stripIndents } from 'common-tags';

const cepSchema = z.string().regex(/^\d{5}-?\d{3}$/);

const schema = z.object({
  name: z.string().optional(),
  message: z.string().optional(),
  type: z.string().optional(),
  cep: cepSchema,
  state: z.string().length(2),
  city: z.string(),
  neighborhood: z.string(),
  street: z.string(),
  service: z.string(),
  location: z.object({
    type: z.string(),
    coordinates: z.object({
      latitude: z.coerce.number().optional(),
      longitude: z.coerce.number().optional(),
    }),
  }),
});

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('cep-search')
    .setDescription('Search for a CEP (Brazilian ZIP code)')
    .addStringOption((option) =>
      option
        .setName('cep')
        .setDescription('The CEP to search for')
        .setRequired(true),
    ),
  uses: ['BrasilAPI'],
  cooldown: true,
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();
    const cep = intr.options.getString('cep', true);

    if (!cepSchema.safeParse(cep).success)
      return await sendError(intr, 'Invalid CEP format');

    const result = await fromAsyncThrowable(
      ky(`https://brasilapi.com.br/api/cep/v2/${cep}`).json,
      (e) => `Failed to fetch CEP data:\n${String(e)}`,
    )().andThen((response) => {
      const parsed = schema.safeParse(response);
      return parsed.success
        ? okAsync(parsed.data)
        : errAsync(parsed.error.message);
    });
    if (result.isErr()) return await sendError(intr, result.error);
    const data = result.value;

    if (data.name)
      return await sendError(intr, JSON.stringify(data.name, null, 2));

    const mapsUrl = new URL('https://www.google.com/maps/search/');
    mapsUrl.searchParams.append('api', '1');
    mapsUrl.searchParams.append(
      'query',
      !data.location.coordinates.latitude ||
        !data.location.coordinates.longitude
        ? `${data.street}, ${data.city}, ${data.state}`
        : `${data.location.coordinates.latitude},${data?.location.coordinates.longitude}`,
    );

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
              # CEP Search
              **CEP:** \`${data.cep}\`
              **State:** \`${data.state}\`
              **City:** \`${data.city}\`
              **Neighborhood:** \`${data.neighborhood}\`
              **Street:** \`${data.street}\`
              **Service used:** \`${data.service}\`
              ## Location
              **Type:** \`${data.location.type}\`
              **Latitude:** \`${data.location.coordinates.latitude || 'N/A'}\`
              **Longitude:** \`${data.location.coordinates.longitude || 'N/A'}\`
              `,
            },
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.Button,
                  style: ButtonStyle.Link,
                  label: 'Open in Google Maps',
                  url: mapsUrl.toString(),
                  emoji: { name: '🌎' },
                },
              ],
            },
            {
              type: ComponentType.TextDisplay,
              content: '> Powered by BrasilAPI',
            },
          ],
        },
      ],
    });
  },
};
