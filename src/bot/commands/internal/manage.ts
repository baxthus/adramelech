import {
  ChatInputCommandInteraction,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  TextInputStyle,
} from 'discord.js';
import type { Command } from '#bot/types/command';
import ownerOnly from '#bot/preconditions/ownerOnly';
import { sendError } from '#bot/utils/sendError';
import db from '#db';
import { phrases } from '#db/schema';
import env from '#env';
import type { Modal } from '~/bot/types/modal';

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('manage')
    .setDescription('Manage the bot')
    .addSubcommandGroup((group) =>
      group
        .setName('phrases')
        .setDescription('Manage phrases')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('add')
            .setDescription('Add a new phrase to the database')
        )
    ),
  preconditions: [ownerOnly],
  async execute(intr: ChatInputCommandInteraction) {
    const group = commands[intr.options.getSubcommandGroup() ?? ''];
    if (!group) return await sendError(intr, 'Invalid subcommand group');

    const command = group[intr.options.getSubcommand()];
    if (!command) return await sendError(intr, 'Invalid subcommand');

    await command(intr);
  },
};

const phrasesCommands = {
  async add(intr: ChatInputCommandInteraction) {
    await intr.showModal({
      custom_id: 'phrase-add-modal',
      title: 'Add Phrase',
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.TextInput,
              custom_id: 'content',
              label: 'Content',
              style: TextInputStyle.Paragraph,
              placeholder: 'The phrase content goes here',
            },
          ],
        },
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.TextInput,
              custom_id: 'source',
              label: 'Source',
              style: TextInputStyle.Short,
              placeholder:
                'Where the phrase comes from (e.g., a book, a movie)',
            },
          ],
        },
      ],
    });
  },
};

const commands: Record<
  string,
  Record<string, (intr: ChatInputCommandInteraction) => Promise<void>>
> = {
  phrases: phrasesCommands,
};

export const modals: Modal[] = [
  {
    customId: 'phrase-add-modal',
    preconditions: [ownerOnly],
    async execute(intr) {
      await intr.deferReply({ ephemeral: true });

      const content = intr.fields.getTextInputValue('content');
      const source = intr.fields.getTextInputValue('source');

      const response = await db
        .insert(phrases)
        .values({ content, source })
        .onConflictDoNothing()
        .returning();
      if (response.length === 0) {
        // Should not happen because neither content nor source are unique
        return sendError(intr, 'Failed to add phrase');
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
                content: ':white_check_mark: Phrase added successfully!',
              },
            ],
          },
        ],
      });
    },
  },
];
