import {
  ButtonStyle,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import ky from 'ky';
import z from 'zod';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';
import config from '~/config';
import { stripIndents } from 'common-tags';
import { errAsync, fromAsyncThrowable, ok, okAsync } from 'neverthrow';

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

    const ip = z.union([z.ipv4(), z.ipv6()]).safeParse(target).success
      ? ok(target)
      : await getIpFromDomain(target);
    if (ip.isErr()) return await sendError(intr, ip.error);

    const response = await fromAsyncThrowable(
      ky.get(`https://ipwho.is/${ip.value}`, {
        headers: {
          'User-Agent': 'curl', // shh... you didn't see this :3
        },
      }).json,
      (error) =>
        error instanceof Error
          ? error.message
          : 'Failed to fetch IP information',
    )().andThen((json) => {
      const parsed = schema.safeParse(json);
      return parsed.success
        ? okAsync(parsed.data)
        : errAsync('Failed to parse response');
    });
    if (response.isErr()) return await sendError(intr, response.error);
    const data = response.value;

    const mapsUrl = new URL('https://www.google.com/maps/search/');
    mapsUrl.searchParams.set('api', '1');
    mapsUrl.searchParams.set('query', `${data.latitude},${data.longitude}`);

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
              # Lookup
              **IP:** ${ip.value}
              **Domain:** ${target === ip.value ? 'None' : target}
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

const getIpFromDomain = (domain: string) =>
  fromAsyncThrowable(ky.get(`https://da.gd/host/${domain}`).text, (error) =>
    error instanceof Error ? error.message : 'Failed to get IP from domain',
  )().andThen((text) => {
    const res = text.trim();
    if (!res || res.startsWith('No'))
      return errAsync('Failed to get IP from domain');
    return okAsync(
      res.includes(',') ? res.substring(0, res.indexOf(',')) : res,
    );
  });
