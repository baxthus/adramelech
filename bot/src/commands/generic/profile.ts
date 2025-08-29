import {
  SlashCommandBuilder,
  type CommandInteraction,
  type User,
  type ChatInputCommandInteraction,
  MessageFlags,
  ComponentType,
  time,
  TimestampStyles,
  ButtonStyle,
  ActionRowBuilder,
  type ModalActionRowComponentBuilder,
  TextInputBuilder,
  TextInputStyle,
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  UserContextMenuCommandInteraction,
} from 'discord.js';
import {
  executeCommandFromTree,
  type Command,
  type CommandGroupExecutors,
} from '~/types/command';
import { sendError } from '~/utils/sendError';
import toUnixTimestamps from '~/utils/toUnixTimestamps';
import config from '~/config';
import { stripIndents } from 'common-tags';
import { z } from 'zod/mini';
import type { Component } from '~/types/component';
import type { Modal } from '~/types/modal';
import { UIBuilder } from '~/services/UIBuilder';
import SocialsService from 'database/services/SocialsService';
import ProfileService from 'database/services/ProfileService';

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
        subcommand.setName('create').setDescription('Create your profile'),
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
    execute: async (interaction: ChatInputCommandInteraction) =>
      await executeCommandFromTree(executors, interaction),
    async autocomplete(intr) {
      if (
        intr.options.getSubcommandGroup(false) !== 'remove' ||
        intr.options.getSubcommand() !== 'social'
      )
        return;

      const focused = intr.options.getFocused();
      const socials = await SocialsService.findSocialsByName(
        intr.user.id,
        focused,
        false,
      );
      if (!socials) return await intr.respond([]);

      await intr.respond(
        socials.map((social) => ({
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
  create: createProfile,
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

async function viewProfile(intr: CommandInteraction, user: User) {
  await intr.deferReply();

  const data = await ProfileService.findProfileByDiscordId(user.id);
  if (!data) return await sendError(intr, 'This user does not have a profile');
  const socials = await SocialsService.listSocialsByDiscordId(user.id);

  const haveSocials = socials.length > 0;

  const registeredAt = toUnixTimestamps(data.created_at.getTime());

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2,
    components: [
      {
        type: ComponentType.Container,
        accent_color: config.EMBED_COLOR,
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
            content: haveSocials ? undefined : 'No social links found',
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
              '> For information about the user discord profile, use /user-info or "User Info" context menu command',
          },
        ],
      },
    ],
  });
}

async function createProfile(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const user = await ProfileService.createProfile(intr.user.id);
  if (user.length === 0)
    return await sendError(intr, 'You already have a profile!');

  await intr.followUp(
    UIBuilder.createGenericSuccess('# Your profile has been created!'),
  );
}

async function deleteProfile(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  if (!(await ProfileService.userExists(intr.user.id)))
    return await sendError(intr, 'You do not have a profile to delete');

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: [
      {
        type: ComponentType.Container,
        accent_color: config.EMBED_COLOR,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: stripIndents`
            ### Are you sure you want to delete your profile?
            This action is irreversible and will delete all your profile information
            `,
          },
          { type: ComponentType.Separator, divider: false },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                custom_id: 'button-delete-profile',
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
  if (!(await ProfileService.userExists(intr.user.id)))
    return await sendError(intr, 'You do not have a profile to edit');

  await intr.showModal({
    title: 'Edit Bio',
    customId: 'modal-edit-bio',
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

  const exists = await ProfileService.userExists(intr.user.id);
  if (!exists)
    return await sendError(intr, 'You do not have a profile to edit');

  const nickname = intr.options.getString('nickname', true).trim();

  const updated = await ProfileService.updateProfile(intr.user.id, {
    nickname,
  });
  if (updated.length === 0)
    return await sendError(intr, 'Failed to update your nickname');

  await intr.followUp(
    UIBuilder.createGenericSuccess('# Your nickname has been updated!'),
  );
}

async function addSocial(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const name = intr.options.getString('name', true).trim();
  const link = intr.options.getString('link', true).trim();

  if (!z.url().safeParse(link).success)
    return await sendError(intr, 'The provided link is not a valid URL');

  const user = await ProfileService.findProfileByDiscordId(intr.user.id);
  if (!user) return await sendError(intr, 'You do not have a profile to edit');

  const socials = await SocialsService.listSocialsByDiscordId(intr.user.id);

  if (socials.length >= 5)
    return await sendError(
      intr,
      'You can only have up to 5 social links in your profile',
    );

  if (
    socials.some((social) => social.name.toLowerCase() === name.toLowerCase())
  )
    return await sendError(
      intr,
      `You already have a social link with the name \`${name}\`. Please choose a different name`,
    );

  const inserted = await SocialsService.createSocial(user.id, name, link);
  if (inserted.length === 0)
    return await sendError(intr, 'Failed to add the social link');

  await intr.followUp(
    UIBuilder.createGenericSuccess('# The social link has been added!'),
  );
}

async function removeBio(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const user = await ProfileService.findProfileByDiscordId(intr.user.id);
  if (!user) return await sendError(intr, 'You do not have a profile to edit');
  if (!user.bio)
    return await sendError(intr, 'You do not have a bio to remove');

  const updated = await ProfileService.updateProfile(intr.user.id, {
    bio: null,
  });
  if (updated.length === 0)
    return await sendError(intr, 'Failed to remove your bio');

  await intr.followUp(
    UIBuilder.createGenericSuccess('# Your bio has been removed!'),
  );
}

async function removeNickname(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const user = await ProfileService.findProfileByDiscordId(intr.user.id);
  if (!user) return await sendError(intr, 'You do not have a profile to edit');
  if (!user.nickname)
    return await sendError(intr, 'You do not have a nickname to remove');

  const updated = await ProfileService.updateProfile(intr.user.id, {
    nickname: null,
  });
  if (updated.length === 0)
    return await sendError(intr, 'Failed to remove your nickname');

  await intr.followUp(
    UIBuilder.createGenericSuccess('# Your nickname has been removed!'),
  );
}

async function removeSocial(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const name = intr.options.getString('name', true).trim();

  const user = await ProfileService.findProfileByDiscordId(intr.user.id);
  if (!user) return await sendError(intr, 'You do not have a profile to edit');

  const data = await SocialsService.findSocialsByName(intr.user.id, name);
  if (data.length === 0)
    return await sendError(
      intr,
      'You do not have a social link with that name to remove',
    );

  const deleted = await SocialsService.deleteSocial(user.id, data[0]!.id);

  if (deleted.length === 0)
    return await sendError(intr, 'Failed to remove the social link');

  await intr.followUp(
    UIBuilder.createGenericSuccess('# The social link has been removed!'),
  );
}

export const component = <Component>{
  type: ComponentType.Button,
  customId: 'button-delete-profile',
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const deleted = await ProfileService.deleteProfile(interaction.user.id);
    if (deleted.length === 0)
      return await sendError(interaction, 'Failed to delete your profile');

    await interaction.followUp(
      UIBuilder.createGenericSuccess('# Your profile has been deleted!'),
    );
  },
};

export const modal = <Modal>{
  customId: 'modal-edit-bio',
  async execute(intr) {
    await intr.deferReply({ flags: MessageFlags.Ephemeral });

    const content = intr.fields.getTextInputValue('content').trim();

    const updated = await ProfileService.updateProfile(intr.user.id, {
      bio: content,
    });
    if (updated.length === 0)
      return await sendError(intr, 'Failed to update your bio');

    await intr.followUp(
      UIBuilder.createGenericSuccess('# Your bio has been updated!'),
    );
  },
};
