import { stripIndents } from 'common-tags';
import {
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import ky from 'ky';
import { z } from 'zod';
import type { Result } from '~/common/result';
import env from '#env';
import type { Command } from '#bot/types/command';
import { sendError } from '#bot/utils/sendError';

const schema = z.object({
  success: z.boolean(),
  type: z.union([z.literal('IPv4'), z.literal('IPv6')]),
  continent: z.string(),
  country: z.string(),
  country_code: z.string().length(2),
  region: z.string(),
  city: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  postal: z.string(),
  connection: z.object({
    asn: z.number(),
    org: z.string(),
    isp: z.string(),
    domain: z.string(),
  }),
  timezone: z.object({
    id: z.string(),
    offset: z.number(),
    utc: z.string(),
  }),
});

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('lookup')
    .setDescription('Lookup a domain or IP address')
    .addStringOption((option) =>
      option
        .setName('target')
        .setDescription('The domain or IP address to lookup')
        .setRequired(true),
    ),
  cooldown: true,
  uses: ['ipwhois.io', 'da.gd'],
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    const target = intr.options.getString('target', true);
    const match = z.string().ip().safeParse(target);
    const ip: Result<string> = match.success
      ? { data: target }
      : await getIpFromDomain(target);

    if (ip.error) return await sendError(intr, 'Failed to get IP from domain');

    const response = await ky
      .get(`https://ipwho.is/${ip.data}`, {
        headers: {
          'User-Agent': 'curl', // :3
        },
      })
      .json();
    const { data, error } = schema.safeParse(response);
    if (error) return await sendError(intr, 'Failed to parse response');

    const mapsUrl = new URL('https://www.google.com/maps/search/');
    mapsUrl.searchParams.append('api', '1');
    mapsUrl.searchParams.append('query', `${data.latitude},${data.longitude}`);

    await intr.followUp({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
              # Lookup
              **IP:** ${ip.data}
              **Domain:** ${target === ip.data ? 'None' : target}
              **Type:** ${data.type}
              `,
            },
            { type: ComponentType.Separator },
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
              ## Location
              **Continent:** ${data.continent}
              **Country:** ${data.country} :flag_${data.country_code.toLowerCase()}:
              **Region:** ${data.region}
              **City:** ${data.city}
              **Latitude:** ${data.latitude}
              **Longitude:** ${data.longitude}
              **Postal Code:** ${data.postal}
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
            { type: ComponentType.Separator },
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
              ## Connection
              **ASN:** ${data.connection.asn}
              **Organization:** ${data.connection.org}
              **ISP:** ${data.connection.isp}
              **Domain:** ${data.connection.domain}
              `,
            },
            { type: ComponentType.Separator },
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
              ## Timezone
              **ID:** ${data.timezone.id}
              **Offset:** ${data.timezone.offset}
              **UTC:** ${data.timezone.utc}
              `,
            },
            {
              type: ComponentType.TextDisplay,
              content: '> Powered by ipwhois.io and da.gd',
            },
          ],
        },
      ],
    });
  },
};

async function getIpFromDomain(domain: string): Promise<Result<string>> {
  const response = (await ky.get(`https://da.gd/host/${domain}`).text()).trim();
  if (!response || response.startsWith('No'))
    return { error: new Error('Failed to get IP from domain') };

  return {
    data: response.includes(',')
      ? response.substring(0, response.indexOf(','))
      : response,
  };
}
