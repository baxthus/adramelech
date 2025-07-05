import { stripIndents } from 'common-tags';
import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  CommandInteraction,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  TextInputStyle,
  type ModalActionRowComponentBuilder,
} from 'discord.js';
import env from '#env';
import type { Command, CommandExecutors } from '#bot/types/command';
import type { Modal } from '#bot/types/modal';
import { sendError } from '#bot/utils/sendError';
import db from '#db';
import { feedbacks, users } from '~/database/schema';
import { and, eq, inArray, like, sql } from 'drizzle-orm';
import v from 'voca';
import toUnixTimestamps from '~/utils/toUnixTimestamps';

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
        .addNumberOption((option) =>
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
        .addNumberOption((option) =>
          option
            .setName('feedback')
            .setDescription('The feedback to close')
            .setRequired(true)
            .setAutocomplete(true),
        ),
    ),
  cooldown: 86400, // 1 day
  async execute(intr: ChatInputCommandInteraction) {
    const subcommand = intr.options.getSubcommand();

    const executor = executors[subcommand];
    if (typeof executor !== 'function')
      return await sendError(intr, 'Invalid subcommand');

    await executor(intr);
  },
  async autocomplete(intr) {
    const subcommand = intr.options.getSubcommand();
    if (subcommand !== 'view' && subcommand !== 'close') return;

    // Only show open or acknowledged feedbacks for close command
    // For view command, show all feedbacks
    const filter =
      subcommand === 'view'
        ? undefined
        : inArray(feedbacks.status, ['open', 'acknowledged']);

    const focused = intr.options.getFocused();
    const data = await db.query.users.findFirst({
      columns: {},
      where: eq(users.discord_id, intr.user.id),
      with: {
        feedbacks: {
          columns: { id: true, title: true },
          where: and(filter, like(feedbacks.title, `%${focused}%`)),
        },
      },
    });
    if (!data) return await intr.respond([]);

    await intr.respond(
      data.feedbacks.map((feedback) => ({
        name: feedback.title,
        value: feedback.id,
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
  if (!(await userExists(intr)))
    return sendError(
      intr,
      'You need to register first using `/profile create` command.',
    );

  await intr.showModal({
    customId: 'feedback-modal',
    title: 'Feedback',
    components: [
      new ActionRowBuilder<ModalActionRowComponentBuilder>({
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
      }),
      new ActionRowBuilder<ModalActionRowComponentBuilder>({
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
      }),
    ],
  });
}

async function viewFeedback(intr: ChatInputCommandInteraction) {
  await intr.deferReply({ flags: MessageFlags.Ephemeral });

  const user = await db.query.users.findFirst({
    columns: { id: true },
    where: eq(users.discord_id, intr.user.id),
  });
  if (!user)
    return sendError(
      intr,
      'You need to register first using `/profile create` command',
    );

  const feedbackId = intr.options.getNumber('feedback', true);

  const feedback = await db.query.feedbacks.findFirst({
    columns: { id: false, user_id: false },
    where: and(eq(feedbacks.id, feedbackId), eq(feedbacks.user_id, user.id)),
  });
  if (!feedback)
    return sendError(intr, 'Feedback not found or does not belong to you');

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
            # Feedback Details
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
            ### Created At
            <t:${toUnixTimestamps(feedback.created_at.getTime())}:R>
            ### Updated At
            <t:${toUnixTimestamps(feedback.updated_at.getTime())}:R>
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

  const user = await db.query.users.findFirst({
    columns: { id: true },
    where: eq(users.discord_id, intr.user.id),
  });
  if (!user)
    return await sendError(
      intr,
      'You need to register first using `/profile create` command',
    );

  const feedbackId = intr.options.getNumber('feedback', true);

  const updated = await db
    .update(feedbacks)
    .set({ status: 'closed' })
    .where(
      and(
        eq(feedbacks.id, feedbackId),
        eq(feedbacks.user_id, user.id),
        inArray(feedbacks.status, ['open', 'acknowledged']),
      ),
    )
    .returning({ id: feedbacks.id });
  if (updated.length === 0)
    return await sendError(
      intr,
      'Failed to close feedback. It may not exist, not be open, or not belong to you.',
    );

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: [
      {
        type: ComponentType.Container,
        accent_color: env.EMBED_COLOR,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: '# Feedback closed successfully!',
          },
        ],
      },
    ],
  });
}

async function userExists(intr: CommandInteraction): Promise<boolean> {
  return (
    await db.execute(
      sql`SELECT EXISTS (SELECT 1 FROM users WHERE discord_id = ${intr.user.id})`,
    )
  )[0].exists as boolean;
}

export const modal = <Modal>{
  customId: 'feedback-modal',
  async execute(intr) {
    await intr.deferReply({ flags: MessageFlags.Ephemeral });

    const title = intr.fields.getTextInputValue('title');
    const content = intr.fields.getTextInputValue('content');

    const user = await db.query.users.findFirst({
      columns: { id: true },
      where: eq(users.discord_id, intr.user.id),
    });
    if (!user) return await sendError(intr, 'User not found in the database');

    const data = await db
      .insert(feedbacks)
      .values({
        user_id: user.id,
        title,
        content,
      })
      .returning({ id: feedbacks.id });
    if (!data)
      return await sendError(intr, 'Failed to save feedback to the database');

    await intr.followUp({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: '# Feedback submitted!',
            },
          ],
        },
      ],
    });
  },
};
