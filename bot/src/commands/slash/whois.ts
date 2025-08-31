import {
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import ky from 'ky';
import type { Command } from '~/types/command';
import config from '~/config';
import { stripIndents } from 'common-tags';
import { sendError } from '~/utils/sendError';

const badResponses = [
  'Malformed',
  'Wrong',
  'The queried object does not',
  'Invalid',
  'No match',
  'Domain not',
  'NOT FOUND',
  'Did not get',
  'Closing connection',
];

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('Get information about a domain or IP address')
    .addStringOption((option) =>
      option
        .setName('target')
        .setDescription('The domain or IP address to look up')
        .setRequired(true),
    ),
  cooldown: true,
  uses: ['da.gd'],
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    const target = intr.options.getString('target', true);

    const response = await ky
      .get(`https://da.gd/w/${target}`, {
        timeout: 10000, // 10 seconds
      })
      .text();
    if (!response.trim() || badResponses.some((r) => response.includes(r)))
      return await sendError(intr, 'No information found');

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
              # Whois Lookup
              ### :mag: Target
              \`\`\`${target}\`\`\`
              `,
            },
            {
              type: ComponentType.TextDisplay,
              content: '### :page_with_curl: Response',
            },
            {
              type: ComponentType.File,
              file: {
                url: 'attachment://whois.txt',
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
          attachment: Buffer.from(response),
          name: 'whois.txt',
        },
      ],
    });
  },
};
