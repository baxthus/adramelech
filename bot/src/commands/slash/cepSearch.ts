import z from 'zod';
import type { Command } from '~/types/command.ts';
import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { sendError } from '~/utils/sendError.ts';
import ky from 'ky';

const cepSchema = z.string().regex(/^\d{5}-?\d{3}$/);

const schema = z.object({
  name: z.string().optional(),
  message: z.string().optional(),
  type: z.string().optional(),
  cep: cepSchema,
  state: z.string().min(2).max(2),
  city: z.string(),
  neighborhood: z.string(),
  street: z.string(),
  service: z.string(),
  location: z.object({
    type: z.string(),
    coordinates: z.object({
      latitude: z.string().transform(Number),
      longitude: z.string().transform(Number),
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
      return await sendError(intr, 'Invalid CEPO format');

    const response = await ky(
      `https://brasilapi.com.br/api/cep/v2/${cep}`,
    ).json();
    const { data, error } = schema.safeParse(response);
    if (error) return await sendError(intr, 'Failed to fetch CEP data');

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
  },
};
