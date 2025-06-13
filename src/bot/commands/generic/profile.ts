import type { Command } from '#bot/types/command';
import db from '#db';
import { users, type User } from '#db/schema';
import env from '#env';
import {
  ApplicationCommandType,
  ButtonStyle,
  ChatInputCommandInteraction,
  CommandInteraction,
  ComponentType,
  ContextMenuCommandBuilder,
  MessageFlags,
  SlashCommandBuilder,
  time,
  TimestampStyles,
  UserContextMenuCommandInteraction,
  type User as DiscordUser,
} from 'discord.js';
import { eq } from 'drizzle-orm';
import type { Component } from '#bot/types/component';
import { sendError } from '#bot/utils/sendError';
import { stripIndents } from 'common-tags';
import toUnixTimestamps from '~/utils/toUnixTimestamps';

export const commands = <Command[]>[
  {
    data: new SlashCommandBuilder()
      .setName('profile')
      .setDescription('Manage your profile')
      .addSubcommand((subcommand) =>
        subcommand
          .setName('view')
          .setDescription('View your profile')
          .addUserOption((option) =>
            option
              .setName('user')
              .setDescription('To view the profile of another user')
          )
      ),
    async execute(intr: ChatInputCommandInteraction) {
      switch (intr.options.getSubcommand()) {
        case 'view': {
          const user = intr.options.getUser('user') ?? intr.user;
          await view(intr, user);
          break;
        }
        default:
          await sendError(intr, 'Unknown subcommand');
          break;
      }
    },
  },
  {
    data: new ContextMenuCommandBuilder()
      .setName('Profile')
      .setType(ApplicationCommandType.User),
    execute: async (intr: UserContextMenuCommandInteraction) =>
      await view(intr, intr.targetUser),
  },
];

async function view(intr: CommandInteraction, user: DiscordUser) {
  await intr.deferReply();

  const data = await verifyUser(intr, user);
  if (!data) return;

  const registeredAt = toUnixTimestamps(data.created_at.getTime());

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2,
    components: [
      {
        type: ComponentType.Container,
        accent_color: env.EMBED_COLOR,
        components: [
          {
            type: ComponentType.Section,
            accessory: {
              type: ComponentType.Thumbnail,
              media: { url: user.displayAvatarURL({ size: 1024 }) },
            },
            components: [
              {
                type: ComponentType.TextDisplay,
                content: stripIndents`
                # ${user.username}
                ### **ID**
                \`${data.id}\`
                ### **Registered At**
                ${time(registeredAt, TimestampStyles.ShortDateTime)} (${time(registeredAt, TimestampStyles.RelativeTime)})
                ### **Nickname**
                \`${data.nickname ?? 'None'}\`
                ### **Bio**
                \`\`\`${data.bio ?? 'None'}\`\`\`
                `,
              },
            ],
          },
        ],
      },
    ],
  });
}

async function verifyUser(
  intr: CommandInteraction,
  user: DiscordUser
): Promise<User | void> {
  const data = await db.query.users.findFirst({
    where: eq(users.discord_id, user.id),
  });
  if (data) return data;

  if (intr.user.id !== user.id)
    return await sendError(
      intr,
      `The user \`${user.username}\` does not have a profile!`
    );

  if (!intr.ephemeral) {
    // Delete the initial reply because we need it to be ephemeral
    const msg = await intr.followUp('opps...');
    await msg.delete().catch(() => null);
  }

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: [
      {
        type: ComponentType.Container,
        accent_color: env.EMBED_COLOR,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: '# You need to register yourself first!',
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                custom_id: 'register-profile',
                label: 'Register',
                style: ButtonStyle.Primary,
                emoji: { name: '📝' },
              },
            ],
          },
        ],
      },
    ],
  });
}

export const component = <Component>{
  type: ComponentType.Button,
  customId: 'register-profile',
  async execute(intr) {
    await intr.deferReply({ flags: MessageFlags.Ephemeral });

    const user = await db
      .insert(users)
      .values({
        discord_id: intr.user.id,
      })
      .returning({ id: users.id })
      .onConflictDoNothing();
    if (user.length === 0)
      return await sendError(intr, 'You already have a profile!');

    await intr.followUp({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: `# Your profile has been created!`,
            },
          ],
        },
      ],
    });
  },
};
