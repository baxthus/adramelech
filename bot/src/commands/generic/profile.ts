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
import type {
  Command,
  CommandGroupExecutors,
  SubcommandExecutor,
} from '~/types/command';
import { sendError } from '~/utils/sendError';
import toUnixTimestamps from '~/utils/toUnixTimestamps';
import config from '~/config';
import { stripIndents } from 'common-tags';
import { z } from 'zod/mini';
import type { Component } from '~/types/component';
import type { Modal } from '~/types/modal';
import { ProfileService } from '~/services/ProfileService';
import { UIBuilder } from '~/services/UIBuilder';

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
    async execute(interaction: ChatInputCommandInteraction) {
      const groupName = interaction.options.getSubcommandGroup(false);
      const subcommandName = interaction.options.getSubcommand();

      let executor: SubcommandExecutor | undefined;

      if (groupName) {
        const group = executors[groupName];
        if (group && typeof group === 'object' && !Array.isArray(group))
          executor = group[subcommandName];
      } else {
        const directExecutor = executors[subcommandName];
        if (typeof directExecutor === 'function') executor = directExecutor;
      }

      if (executor) await executor(interaction);
      else await sendError(interaction, 'Unknown subcommand');
    },
    async autocomplete(interaction) {
      if (
        interaction.options.getSubcommandGroup(false) !== 'remove' ||
        interaction.options.getSubcommand() !== 'social'
      )
        return;

      const focused = interaction.options.getFocused();
      const socials = await ProfileService.findSocialLink(
        interaction.user.id,
        focused,
        false,
      );
      if (!socials) return await interaction.respond([]);

      await interaction.respond(
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

  const data = await ProfileService.findUserProfile(user.id, true);
  if (!data) return await sendError(intr, 'This user does not have a profile');

  const haveSocials = data.socials.length > 0;

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
            components: data.socials.map((social) => ({
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

  const updated = await ProfileService.updateNickname(intr.user.id, nickname);
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

  const data = await ProfileService.findUserProfile(intr.user.id, true);
  if (!data) return await sendError(intr, 'You do not have a profile to edit');

  if (data.socials.length >= 5)
    return await sendError(
      intr,
      'You can only have up to 5 social links in your profile',
    );

  if (
    data.socials.some(
      (social) => social.name.toLowerCase() === name.toLowerCase(),
    )
  )
    return await sendError(
      intr,
      `You already have a social link with the name \`${name}\`. Please choose a different name`,
    );

  const inserted = await ProfileService.addSocialLink(data.id, name, link);
  if (inserted.length === 0)
    return await sendError(intr, 'Failed to add the social link');

  await intr.followUp(
    UIBuilder.createGenericSuccess('# The social link has been added!'),
  );
}

async function removeBio(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const data = await ProfileService.findUserProfile(intr.user.id, true);
  if (!data) return await sendError(intr, 'You do not have a profile to edit');
  if (!data.bio)
    return await sendError(intr, 'You do not have a bio to remove');

  const updated = await ProfileService.updateBio(intr.user.id, null);
  if (updated.length === 0)
    return await sendError(intr, 'Failed to remove your bio');

  await intr.followUp(
    UIBuilder.createGenericSuccess('# Your bio has been removed!'),
  );
}

async function removeNickname(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const data = await ProfileService.findUserProfile(intr.user.id, true);
  if (!data) return await sendError(intr, 'You do not have a profile to edit');
  if (!data.nickname)
    return await sendError(intr, 'You do not have a nickname to remove');

  const updated = await ProfileService.updateNickname(intr.user.id, null);
  if (updated.length === 0)
    return await sendError(intr, 'Failed to remove your nickname');

  await intr.followUp(
    UIBuilder.createGenericSuccess('# Your nickname has been removed!'),
  );
}

async function removeSocial(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const name = intr.options.getString('name', true).trim();

  const user = await ProfileService.findUserProfile(intr.user.id);
  if (!user) return await sendError(intr, 'You do not have a profile to edit');

  const data = await ProfileService.findSocialLink(intr.user.id, name, true);
  if (data.length === 0)
    return await sendError(
      intr,
      'You do not have a social link with that name to remove',
    );

  const deleted = await ProfileService.removeSocialLink(user.id, name);

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
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const content = interaction.fields.getTextInputValue('content').trim();

    const updated = await ProfileService.updateBio(
      interaction.user.id,
      content,
    );
    if (updated.length === 0)
      return await sendError(interaction, 'Failed to update your bio');

    await interaction.followUp(
      UIBuilder.createGenericSuccess('# Your bio has been updated!'),
    );
  },
};
