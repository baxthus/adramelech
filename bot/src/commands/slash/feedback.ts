import {
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
} from 'discord.js';
import {
  executeCommandFromTree,
  type Command,
  type CommandExecutors,
} from '~/types/command';
import { sendError } from '~/utils/sendError';
import config from '~/config';
import { stripIndents } from 'common-tags';
import toUnixTimestamps from '~/utils/toUnixTimestamps';
import v from 'voca';
import { UIBuilder } from '~/services/UIBuilder';
import type { Modal } from '~/types/modal';
import type { FeedbackWhereInput } from 'database/generated/prisma/models';
import { prisma } from 'database';

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('feedback')
    .setDescription('Send suggestions/bug reports to the bot developers')
    .addSubcommand((subcommand) =>
      subcommand.setName('create').setDescription('Create a new feedback'),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('view')
        .setDescription('View your feedbacks')
        .addStringOption((option) =>
          option
            .setName('feedback')
            .setDescription('The feedback to view')
            .setRequired(true)
            .setAutocomplete(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('close')
        .setDescription('Close a feedback')
        .addStringOption((option) =>
          option
            .setName('feedback')
            .setDescription('The feedback to close')
            .setRequired(true)
            .setAutocomplete(true),
        ),
    ),
  cooldown: 86400, // 1 day
  execute: async (intr: ChatInputCommandInteraction) =>
    await executeCommandFromTree(executors, intr),
  async autocomplete(intr) {
    const subcommand = intr.options.getSubcommand();
    if (subcommand !== 'view' && subcommand !== 'close') return;

    // Only show open or acknowledged feedbacks for close command
    // For view command, show all feedbacks
    const filter: FeedbackWhereInput | undefined =
      subcommand === 'view'
        ? undefined
        : { status: { in: ['OPEN', 'ACKNOWLEDGED'] } };

    const focused = intr.options.getFocused();
    const feedbacks = await prisma.feedback.findMany({
      where: {
        profile: {
          discordId: intr.user.id,
        },
        title: {
          contains: focused,
          mode: 'insensitive',
        },
        ...(filter || {}),
      },
      select: { id: true, title: true },
    });
    if (!feedbacks.length) return await intr.respond([]);

    await intr.respond(
      feedbacks.map((f) => ({
        name: f.title,
        value: f.id,
      })),
    );
  },
};

const executors: CommandExecutors = {
  create: createFeedback,
  view: viewFeedback,
  close: closeFeedback,
};

async function createFeedback(intr: ChatInputCommandInteraction) {
  if (!(await prisma.profile.$exists({ discordId: intr.user.id })))
    return await sendError(
      intr,
      'You need to register first using `/profile create` command',
    );

  await intr.showModal({
    customId: 'modal-feedback',
    title: 'Feedback',
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.TextInput,
            customId: 'title',
            label: 'Title',
            style: TextInputStyle.Short,
            placeholder: 'Enter a title for your feedback',
            required: true,
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.TextInput,
            customId: 'content',
            label: 'Content',
            style: TextInputStyle.Paragraph,
            placeholder: 'Enter the content of your feedback',
            required: true,
          },
        ],
      },
    ],
  });
}

async function viewFeedback(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const feedbackId = intr.options.getString('feedback', true);

  const profile = await prisma.profile.findFirst({
    where: { discordId: intr.user.id },
    select: { id: true },
  });
  if (!profile)
    return await sendError(
      intr,
      'You need to register first using `/profile create` command',
    );

  const feedback = await prisma.feedback.findFirst({
    where: {
      id: feedbackId,
      profileId: profile.id,
    },
  });
  if (!feedback)
    return await sendError(
      intr,
      'Feedback not found or does not belong to you',
    );

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
            # Feedback details
            ### ID
            \`\`\`${feedbackId}\`\`\`
            `,
          },
          {
            type: ComponentType.TextDisplay,
            content: stripIndents`
            ### Title
            \`\`\`${feedback.title}\`\`\`
            `,
          },
          {
            type: ComponentType.TextDisplay,
            content: stripIndents`
            ### Created at
            <t:${toUnixTimestamps(feedback.createdAt.getTime())}:R>
            ### Updated at
            <t:${toUnixTimestamps(feedback.updatedAt.getTime())}:R>
            ### Status
            \`\`\`${v.titleCase(feedback.status)}\`\`\`
            `,
          },
          {
            type: ComponentType.TextDisplay,
            content: stripIndents`
            ### Content
            \`\`\`${feedback.content}\`\`\`
            `,
          },
          {
            type: ComponentType.TextDisplay,
            content: stripIndents`
            ### Response
            \`\`\`${feedback.response || 'No response'}\`\`\`
            `,
          },
        ],
      },
    ],
  });
}

async function closeFeedback(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const profile = await prisma.profile.findFirst({
    where: { discordId: intr.user.id },
    select: { id: true },
  });
  if (!profile)
    return await sendError(
      intr,
      'You need to register first using `/profile create` command',
    );

  const feedbackId = intr.options.getString('feedback', true);

  const result = await prisma.feedback.updateMany({
    where: {
      id: feedbackId,
      profileId: profile.id,
      status: { in: ['OPEN', 'ACKNOWLEDGED'] },
    },
    data: {
      status: 'CLOSED',
    },
  });
  if (!result.count)
    return await sendError(
      intr,
      'Failed to close feedback. It may not exist, not be open, or not belong to you',
    );

  await intr.followUp(
    UIBuilder.createGenericSuccess('# Feedback closed successfully!'),
  );
}

export const modal = <Modal>{
  customId: 'modal-feedback',
  async execute(intr) {
    await intr.deferReply({ flags: MessageFlags.Ephemeral });

    const profile = await prisma.profile.findFirst({
      where: { discordId: intr.user.id },
      select: { id: true },
    });
    if (!profile)
      return await sendError(
        intr,
        'You need to register first using `/profile create` command',
      );

    const title = intr.fields.getTextInputValue('title');
    const content = intr.fields.getTextInputValue('content');

    await prisma.feedback.create({
      data: {
        profileId: profile.id,
        title,
        content,
      },
    });

    await intr.followUp(
      UIBuilder.createGenericSuccess('# Feedback submitted!'),
    );
  },
};
