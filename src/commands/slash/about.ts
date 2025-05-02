import { stripIndents } from 'common-tags';
import {
  ButtonStyle,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  time,
  TimestampStyles,
} from 'discord.js';
import type { CustomClient } from '~';
import env from '~/env';
import type { Command } from '~/types/command';

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('About the bot'),
  async execute(intr) {
    const client = intr.client as CustomClient;
    const info = await client.application?.fetch();
    const owner = await client.users.fetch(info!.owner!.id);

    await intr.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.Section,
              components: [
                {
                  type: ComponentType.TextDisplay,
                  content: stripIndents`
                  # About the bot
                  \`\`\`${client.user?.username}\`\`\`
                  `,
                },
              ],
              accessory: {
                type: ComponentType.Thumbnail,
                media: {
                  url: client.user!.displayAvatarURL({ size: 1024 }),
                },
              },
            },
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.Button,
                  style: ButtonStyle.Link,
                  label: 'Repository',
                  url: env.REPOSITORY_URL,
                },
                {
                  type: ComponentType.Button,
                  style: ButtonStyle.Link,
                  label: 'Support',
                  url: env.SUPPORT_URL,
                },
              ],
            },
            { type: ComponentType.Separator },
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
                > **Commands**
                Currently, there are \`${client.commands.size}\` commands available.
                > **Running on**
                Bun \`${Bun.version}\` on \`${process.platform} ${process.arch}\`
                > **Uptime**
                ${time(
                  Math.floor(Date.now() / 1000 - process.uptime()),
                  TimestampStyles.RelativeTime
                )}
                > **Memory Usage**
                \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\`
                > **Guilds**
                \`${client.guilds.cache.size}\`
                > **Users**
                \`${client.users.cache.size}\`
              `,
            },
            { type: ComponentType.Separator },
            {
              type: ComponentType.Section,
              components: [
                {
                  type: ComponentType.TextDisplay,
                  content: stripIndents`
                  # Author
                  \`\`\`${owner.username}\`\`\`
                  `,
                },
              ],
              accessory: {
                type: ComponentType.Thumbnail,
                media: {
                  url: owner.displayAvatarURL({ size: 1024 }),
                },
              },
            },
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.Button,
                  style: ButtonStyle.Link,
                  label: 'Website',
                  url: env.AUTHOR_URL,
                },
              ],
            },
          ],
        },
      ],
    });
  },
};
