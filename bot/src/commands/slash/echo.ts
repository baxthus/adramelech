import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  ComponentType,
  TextInputStyle,
  type TextChannel,
  MessageFlags,
  userMention,
} from 'discord.js';
import type { CommandInfer } from '~/types/command';
import type { ModalInfer } from '~/types/modal';
import { sendError } from '~/utils/sendError';
import { UIBuilder } from '~/services/UIBuilder';
import { fromAsyncThrowable } from 'neverthrow';

export const command = <CommandInfer>{
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Echoes a message')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(intr) {
    await intr.showModal({
      customId: 'modal-echo',
      title: 'Echo',
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.TextInput,
              customId: 'message',
              label: 'Message',
              style: TextInputStyle.Paragraph,
            },
          ],
        },
      ],
    });
  },
};

export const modal = <ModalInfer>{
  customId: 'modal-echo',
  async execute(intr) {
    const message = intr.fields.getTextInputValue('message');

    const result = await fromAsyncThrowable(
      () =>
        (intr.channel as TextChannel).send({
          flags: MessageFlags.IsComponentsV2,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: `\`\`\`${message}\`\`\``,
            },
            {
              type: ComponentType.TextDisplay,
              content: `> ${userMention(intr.user.id)}`,
            },
          ],
        }),
      (e) => `Failed to send message:\n${String(e)}`,
    )();
    if (result.isErr()) return await sendError(intr, result.error);

    await intr.reply(
      UIBuilder.createGenericSuccess('# Message sent successfully'),
    );
  },
};
