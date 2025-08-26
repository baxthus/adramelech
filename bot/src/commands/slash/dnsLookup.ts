import {
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import ky from 'ky';
import UnicodeSheet from '~/tools/UnicodeSheet';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';
import config from '~/config';

type DnsRecord = {
  type: string;
  revalidateIn: string;
  content: string;
};

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('dns-lookup')
    .setDescription("Lookup a domain's DNS records")
    .addStringOption((option) =>
      option
        .setName('domain')
        .setDescription('The domain to lookup')
        .setRequired(true),
    )
    .addBooleanOption((option) =>
      option
        .setName('separate-rows')
        .setDescription('Whether to separate each DNS record into its own row'),
    ),
  uses: ['da.gd'],
  cooldown: true,
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    const domain = intr.options.getString('domain', true);
    const separateRows = intr.options.getBoolean('separate-rows') ?? false;

    const response = await ky.get(`https://da.gd/dns/${domain}`).text();
    const records = parseResponse(response);

    if (records.length === 0)
      return await sendError(intr, 'No DNS record found for this domain');

    let content: string;
    try {
      content = new UnicodeSheet(separateRows)
        .addColumn(
          'Type',
          records.map((record) => record.type),
        )
        .addColumn(
          'Revalidate In',
          records.map((record) => record.revalidateIn),
        )
        .addColumn(
          'Content',
          records.map((record) => record.content),
        )
        .build();
    } catch {
      return await sendError(intr, 'Failed to build the Unicode Sheet');
    }

    await intr.followUp({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: config.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: `# DNS records for \`${domain}\``,
            },
            {
              type: ComponentType.File,
              file: {
                url: 'attachment://records.txt',
              },
            },
            {
              type: ComponentType.TextDisplay,
              content: '> Powered by da.gd',
            },
          ],
        },
      ],
      files: [
        {
          attachment: Buffer.from(content),
          name: 'records.txt',
        },
      ],
    });
  },
};

const parseResponse = (text: string): Array<DnsRecord> =>
  text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => line.split(' '))
    .filter((parts) => parts.length >= 5)
    .map((parts) => ({
      type: parts[3]!,
      revalidateIn: parts[1]!,
      content: parts.slice(4).join(' ').trimEnd(),
    }));
