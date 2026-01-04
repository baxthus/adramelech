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
import { errAsync, fromAsyncThrowable, okAsync } from 'neverthrow';

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

    const result = await fromAsyncThrowable(
      ky.get(`https://da.gd/w/${target}`, {
        timeout: 10000, // 10 seconds
      }).text,
      (e) => `Failed to fetch WHOIS information: ${String(e)}`,
    )().andThen((text) =>
      !text.trim() || badResponses.some((r) => text.includes(r))
        ? errAsync('No information found')
        : okAsync(text),
    );
    if (result.isErr()) return await sendError(intr, result.error);

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
          attachment: Buffer.from(result.value),
          name: 'whois.txt',
        },
      ],
    });
  },
};
