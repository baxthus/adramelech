import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  ComponentType,
  TextInputStyle,
  type TextChannel,
  MessageFlags,
  userMention,
} from 'discord.js';
import type { Command } from '~/types/command';
import type { Modal } from '~/types/modal';
import { sendError } from '~/utils/sendError';
import { UIBuilder } from '~/services/UIBuilder';

export const command = <Command>{
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

export const modal = <Modal>{
  customId: 'modal-echo',
  async execute(intr) {
    const message = intr.fields.getTextInputValue('message');

    try {
      const channel = intr.channel as TextChannel;
      await channel.send({
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
      });
    } catch {
      return await sendError(intr, 'Failed to send message');
    }

    await intr.reply(
      UIBuilder.createGenericSuccess('# Message sent successfully'),
    );
  },
};
