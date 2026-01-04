import type { Command } from '~/types/command.ts';
import {
  type ChatInputCommandInteraction,
  Colors,
  ComponentType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  userMention,
} from 'discord.js';
import { sendError } from '~/utils/sendError.ts';
import config from '~/config.ts';
import { stripIndents } from 'common-tags';
import { fromAsyncThrowable } from 'neverthrow';

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to ban')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('The reason for the ban'),
    )
    .addIntegerOption((option) =>
      option
        .setName('prune-days')
        .setDescription('The number of days to prune messages'),
    )
    .addBooleanOption((option) =>
      option
        .setName('ephemeral')
        .setDescription('Whether to show the response only to you'),
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(intr: ChatInputCommandInteraction) {
    const user = intr.options.getUser('user', true);
    const reason = intr.options.getString('reason') ?? 'No reason provided';
    const pruneDays = intr.options.getInteger('prune-days') ?? 0;
    const ephemeral = intr.options.getBoolean('ephemeral') ?? false;

    if (user.id === intr.user.id)
      return await sendError(intr, "You can't ban yourself");
    if (user.id === intr.client.user.id)
      return await sendError(intr, "You can't ban me OwO");
    if (user.id === intr.guild?.ownerId)
      return await sendError(intr, "You can't ban the server owner");

    const member = intr.guild!.members.cache.get(user.id)!;
    const botMember = intr.guild!.members.cache.get(intr.client.user.id)!;
    if (
      member.roles.highest.comparePositionTo(botMember.roles.highest) >= 0 ||
      !member.bannable
    )
      return await sendError(intr, "I can't ban this user");

    const banResult = await fromAsyncThrowable(
      () =>
        member.ban({
          reason,
          deleteMessageSeconds: pruneDays * 86400,
        }),
      (e) => `Failed to ban user:\n${String(e)}`,
    )();
    if (banResult.isErr()) return await sendError(intr, banResult.error);

    await intr.reply({
      flags: ephemeral
        ? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        : MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: config.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
              # Member banned
              User \`${user.username}\` has been banned
              ### :warning: Reason
              \`\`\`${reason}\`\`\`
              `,
            },
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
              ### :shield: Author
              ${userMention(intr.user.id)}
              `,
            },
          ],
        },
      ],
    });

    const notifyResult = await fromAsyncThrowable(
      () =>
        user.send({
          flags: MessageFlags.IsComponentsV2,
          components: [
            {
              type: ComponentType.Container,
              accent_color: Colors.Red,
              components: [
                {
                  type: ComponentType.TextDisplay,
                  content: stripIndents`
                  # You have been banned
                  ### Guild
                  \`\`\`${intr.guild?.name}\`\`\`
                  `,
                },
                {
                  type: ComponentType.TextDisplay,
                  content: stripIndents`
                  ### Reason
                  \`\`\`${reason}\`\`\`
                  `,
                },
              ],
            },
          ],
        }),
      (e) => `Failed to notify the user about the ban:\n${String(e)}`,
    )();
    if (notifyResult.isErr()) return await sendError(intr, notifyResult.error);
  },
};
