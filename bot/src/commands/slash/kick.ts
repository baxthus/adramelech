import {
  Colors,
  ComponentType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  userMention,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';
import config from '~/config';
import { stripIndents } from 'common-tags';
import { fromAsyncThrowable } from 'neverthrow';

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to kick')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('The reason for the kick'),
    )
    .addBooleanOption((option) =>
      option
        .setName('ephemeral')
        .setDescription('Whether to show the response only to you'),
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(intr: ChatInputCommandInteraction) {
    const user = intr.options.getUser('user', true);
    const reason = intr.options.getString('reason') ?? 'No reason provided';
    const ephemeral = intr.options.getBoolean('ephemeral') ?? false;

    if (user.id === intr.user.id)
      return await sendError(intr, "You can't kick yourself");
    if (user.id === intr.client.user.id)
      return await sendError(intr, "You can't kick me OwO");
    if (user.id === intr.guild?.ownerId)
      return await sendError(intr, "You can't kick the server owner");

    const member = intr.guild!.members.cache.get(user.id)!;
    const botMember = intr.guild!.members.cache.get(intr.client.user.id)!;
    if (
      member.roles.highest.comparePositionTo(botMember.roles.highest) >= 0 ||
      !member.kickable
    )
      return await sendError(intr, "I can't kick this user");

    const result = await fromAsyncThrowable(
      () => member.kick(reason),
      (e) => `Failed to kick user:\n${String(e)}`,
    )();
    if (result.isErr()) return await sendError(intr, result.error);

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
              # Member kicked
              User \`${user.username}\` has been kicked
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
                # You have been kicked
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
      (e) => `Failed to notify the user about the kick:\n${String(e)}`,
    )();
    if (notifyResult.isErr()) return await sendError(intr, notifyResult.error);
  },
};
