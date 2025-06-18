import type {
  Command,
  CommandExecutors,
  CommandGroupExecutors,
  SubcommandExecutor,
} from '#bot/types/command';
import type { Component } from '#bot/types/component';
import type { Modal } from '#bot/types/modal';
import { sendError } from '#bot/utils/sendError';
import db from '#db';
import { socialsLinks, users, type User } from '#db/schemas/schema';
import env from '#env';
import { stripIndents } from 'common-tags';
import {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonStyle,
  ChatInputCommandInteraction,
  CommandInteraction,
  ComponentType,
  ContextMenuCommandBuilder,
  MessageFlags,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  time,
  TimestampStyles,
  UserContextMenuCommandInteraction,
  type User as DiscordUser,
  type InteractionReplyOptions,
  type ModalActionRowComponentBuilder,
} from 'discord.js';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod/v4';
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
              .setDescription('To view the profile of another user'),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand.setName('delete').setDescription('Delete your profile'),
      )
      .addSubcommandGroup((group) =>
        group
          .setName('set')
          .setDescription('Set information in your profile')
          .addSubcommand((subcommand) =>
            subcommand.setName('bio').setDescription('Set your profile bio'),
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName('nickname')
              .setDescription('Set your profile nickname')
              .addStringOption((option) =>
                option
                  .setName('nickname')
                  .setDescription('Your new nickname')
                  .setMaxLength(32)
                  .setRequired(true),
              ),
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName('social')
              .setDescription('Add a social link to your profile')
              .addStringOption((option) =>
                option
                  .setName('name')
                  .setDescription('The name of the social platform')
                  .setRequired(true),
              )
              .addStringOption((option) =>
                option
                  .setName('link')
                  .setDescription('The link to the social profile')
                  .setRequired(true),
              ),
          ),
      )
      .addSubcommandGroup((group) =>
        group
          .setName('remove')
          .setDescription('Remove information from your profile')
          .addSubcommand((subcommand) =>
            subcommand.setName('bio').setDescription('Remove your profile bio'),
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName('nickname')
              .setDescription('Remove your profile nickname'),
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName('social')
              .setDescription('Remove a social link from your profile')
              .addStringOption((option) =>
                option
                  .setName('name')
                  .setDescription('The name of the social platform')
                  .setRequired(true)
                  .setAutocomplete(true),
              ),
          ),
      ),
    async execute(intr: ChatInputCommandInteraction) {
      const groupName = intr.options.getSubcommandGroup(false);
      const subcommandName = intr.options.getSubcommand();

      let executor: SubcommandExecutor | undefined;

      if (groupName) {
        const group = executors[groupName];
        if (group && typeof group === 'object' && !Array.isArray(group))
          executor = (group as CommandExecutors)[subcommandName];
      } else {
        const directExecutor = executors[subcommandName];
        if (typeof directExecutor === 'function')
          executor = directExecutor as SubcommandExecutor;
      }

      if (executor) await executor(intr);
      else await sendError(intr, 'Unknown subcommand');
    },
    async autocomplete(intr) {
      if (
        intr.options.getSubcommandGroup(false) !== 'remove' ||
        intr.options.getSubcommand() !== 'social'
      )
        return;

      const focused = intr.options.getFocused();
      const user = await db.query.users.findFirst({
        columns: { id: true }, // The minimum possible
        where: eq(users.discord_id, intr.user.id),
        with: {
          socials: true,
        },
      });
      if (!user) return await intr.respond([]);

      const filtered = user.socials.filter((social) =>
        social.name.toLowerCase().includes(focused.toLowerCase()),
      );

      await intr.respond(
        filtered.map((social) => ({
          name: social.name,
          value: social.name,
        })),
      );
    },
  },
  {
    data: new ContextMenuCommandBuilder()
      .setName('Profile')
      .setType(ApplicationCommandType.User),
    execute: async (intr: UserContextMenuCommandInteraction) =>
      await viewProfile(intr, intr.targetUser),
  },
];

const executors: CommandGroupExecutors = {
  view: async (intr: ChatInputCommandInteraction) => {
    const user = intr.options.getUser('user') ?? intr.user;
    await viewProfile(intr, user);
  },
  delete: deleteProfile,
  set: {
    bio: setBio,
    nickname: setNickname,
    social: addSocial,
  },
  remove: {
    bio: removeBio,
    nickname: removeNickname,
    social: removeSocial,
  },
};

async function viewProfile(intr: CommandInteraction, user: DiscordUser) {
  await intr.deferReply();

  const data = await verifyUser(intr, user);
  if (!data) return;

  const socials = await db.query.socialsLinks.findMany({
    columns: { name: true, url: true },
    where: eq(socialsLinks.user_id, data.id),
  });
  const haveSocials = socials.length > 0;

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
                ### ID
                \`${data.id}\`
                ### Registered At
                ${time(registeredAt, TimestampStyles.ShortDateTime)} (${time(registeredAt, TimestampStyles.RelativeTime)})
                ### Nickname
                \`${data.nickname ?? 'None'}\`
                ### Bio
                \`\`\`${data.bio ?? 'None'}\`\`\`
                `,
              },
            ],
          },
          {
            type: ComponentType.TextDisplay,
            content: '### Socials',
          },
          {
            type: haveSocials
              ? ComponentType.ActionRow
              : ComponentType.TextDisplay,
            content: haveSocials ? '' : '`No social links found`',
            components: socials.map((social) => ({
              type: ComponentType.Button,
              label: social.name,
              style: ButtonStyle.Link,
              url: social.url,
            })),
          },
          {
            type: ComponentType.TextDisplay,
            content:
              "> For information about the user discord profile, use /user-info or 'User Info' context menu command",
          },
        ],
      },
    ],
  });
}

async function deleteProfile(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const data = await verifyUser(intr, intr.user);
  if (!data) return;

  // Same stuff as setBio, we can trust the user is the one editing their profile

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: [
      {
        type: ComponentType.Container,
        accent_color: env.EMBED_COLOR,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: stripIndents`
            ### Are you sure you want to delete your profile?
            This action is irreversible and will delete all your profile information.
            `,
          },
          { type: ComponentType.Separator, divider: false },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                custom_id: 'delete-profile-button',
                label: 'Confirm',
                style: ButtonStyle.Danger,
                emoji: { name: '🗑️' },
              },
            ],
          },
        ],
      },
    ],
  });
}

async function setBio(intr: ChatInputCommandInteraction) {
  const data = await verifyUser(intr, intr.user);
  if (!data) return;

  // In another occasion, a check to ensure the user is the one editing their profile would be needed.
  // But this command does not accept any user input, so we can skip that.
  // **But what if Discord is lying to us??? :O**

  // Use modal because the bio can be multiline
  await intr.showModal({
    title: 'Edit Bio',
    customId: 'edit-bio-modal',
    components: [
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        new TextInputBuilder({
          customId: 'content',
          label: 'Bio',
          style: TextInputStyle.Paragraph,
          placeholder: 'Enter your new bio here',
          required: true,
        }),
      ),
    ],
  });
}

async function setNickname(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const data = await verifyUser(intr, intr.user);
  if (!data) return;

  // Same stuff as setBio, we can trust the user is the one editing their profile

  const nickname = intr.options.getString('nickname', true)?.trim();

  const updated = await db
    .update(users)
    .set({ nickname: nickname })
    .where(eq(users.id, data.id))
    .returning({ id: users.id }); // Just to check if successful

  if (updated.length === 0)
    return await sendError(intr, 'Failed to update your nickname.');

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: [
      {
        type: ComponentType.Container,
        accent_color: env.EMBED_COLOR,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `# Your nickname has been updated!`,
          },
        ],
      },
    ],
  });
}

async function addSocial(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const data = await verifyUser(intr, intr.user);
  if (!data) return;

  const socials = await db.query.socialsLinks.findMany({
    columns: { id: true, name: true }, // The minimum possible
    where: eq(socialsLinks.user_id, data.id),
  });

  if (socials.length >= 5)
    return await sendError(
      intr,
      'You can only have up to 5 social links in your profile.',
    );

  // Same stuff as setBio, we can trust the user is the one editing their profile

  const name = intr.options.getString('name', true).trim();
  const link = intr.options.getString('link', true).trim();

  if (
    socials.some((social) => social.name.toLowerCase() === name.toLowerCase())
  )
    return await sendError(
      intr,
      `You already have a social link with the name \`${name}\`. Please choose a different name.`,
    );

  if (!z.url().safeParse(link).success)
    return await sendError(intr, 'The provided link is not a valid URL.');

  const inserted = await db
    .insert(socialsLinks)
    .values({ name, url: link, user_id: data.id })
    .returning({ id: socialsLinks.id }); // Just to check if successful

  if (inserted.length === 0)
    return await sendError(intr, 'Failed to add the social link.');

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: [
      {
        type: ComponentType.Container,
        accent_color: env.EMBED_COLOR,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `# The social link has been added!`,
          },
        ],
      },
    ],
  });
}

async function removeBio(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const data = await verifyUser(intr, intr.user);
  if (!data) return;

  const updated = await db
    .update(users)
    .set({ bio: null })
    .where(eq(users.id, data.id))
    .returning({ id: users.id }); // Just to check if successful

  if (updated.length === 0)
    return await sendError(intr, 'Failed to remove your bio.');

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: [
      {
        type: ComponentType.Container,
        accent_color: env.EMBED_COLOR,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `# Your bio has been removed!`,
          },
        ],
      },
    ],
  });
}

async function removeNickname(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const data = await verifyUser(intr, intr.user);
  if (!data) return;

  const updated = await db
    .update(users)
    .set({ nickname: null })
    .where(eq(users.id, data.id))
    .returning({ id: users.id }); // Just to check if successful

  if (updated.length === 0)
    return await sendError(intr, 'Failed to remove your nickname.');

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: [
      {
        type: ComponentType.Container,
        accent_color: env.EMBED_COLOR,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `# Your nickname has been removed!`,
          },
        ],
      },
    ],
  });
}

async function removeSocial(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const data = await verifyUser(intr, intr.user);
  if (!data) return;

  const name = intr.options.getString('name', true).trim();

  const deleted = await db
    .delete(socialsLinks)
    .where(and(eq(socialsLinks.user_id, data.id), eq(socialsLinks.name, name)))
    .returning({ id: socialsLinks.id }); // Just to check if successful

  if (deleted.length === 0)
    return await sendError(intr, 'Failed to remove the social link.');

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: [
      {
        type: ComponentType.Container,
        accent_color: env.EMBED_COLOR,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `# The social link has been removed!`,
          },
        ],
      },
    ],
  });
}

async function verifyUser(
  intr: CommandInteraction | ModalSubmitInteraction,
  user: DiscordUser,
): Promise<User | void> {
  const data = await db.query.users.findFirst({
    where: eq(users.discord_id, user.id),
  });
  if (data) return data;

  if (!intr.ephemeral && intr.deferred) {
    // Delete the initial reply because we need it to be ephemeral
    const msg = await intr.followUp('opps...');
    await msg.delete().catch(() => null);
  }

  const payload = <InteractionReplyOptions>{
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
                custom_id: 'register-profile-button',
                label: 'Register',
                style: ButtonStyle.Primary,
                emoji: { name: '📝' },
              },
            ],
          },
        ],
      },
    ],
  };

  if (intr.deferred) await intr.followUp(payload);
  else await intr.reply(payload);
}

export const components = <Array<Component>>[
  {
    type: ComponentType.Button,
    customId: 'register-profile-button',
    async execute(intr) {
      await intr.deferReply({ flags: MessageFlags.Ephemeral });

      const user = await db
        .insert(users)
        .values({
          discord_id: intr.user.id,
        })
        .returning({ id: users.id }) // Just to check if successful
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
                content: '# Your profile has been created!',
              },
            ],
          },
        ],
      });
    },
  },
  {
    type: ComponentType.Button,
    customId: 'delete-profile-button',
    async execute(intr) {
      await intr.deferReply({ flags: MessageFlags.Ephemeral });

      const deleted = await db
        .delete(users)
        .where(eq(users.discord_id, intr.user.id))
        .returning({ id: users.id }); // Just to check if successful

      if (deleted.length === 0)
        return await sendError(intr, 'Failed to delete your profile.');

      await intr.followUp({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          {
            type: ComponentType.Container,
            accent_color: env.EMBED_COLOR,
            components: [
              {
                type: ComponentType.TextDisplay,
                content: '# Your profile has been deleted!',
              },
            ],
          },
        ],
      });
    },
  },
];

export const modal = <Modal>{
  customId: 'edit-bio-modal',
  async execute(intr) {
    await intr.deferReply({ flags: MessageFlags.Ephemeral });

    const content = intr.fields.getTextInputValue('content').trim();

    // Ideally, we would check if the user exists in the database,
    // but this modal is only shown after the user has been verified,
    // so let's trust that the user has a profile
    // Doing this we avoid an extra database query

    const updated = await db
      .update(users)
      .set({ bio: content })
      .where(eq(users.discord_id, intr.user.id))
      .returning({ id: users.id }); // Just to check if successful

    if (updated.length === 0)
      return await sendError(intr, 'Failed to update your bio.');

    await intr.followUp({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: `# Your bio has been updated!`,
            },
          ],
        },
      ],
    });
  },
};
