import { CustomId } from './customId';
import { Precondition } from './precondition';
import type { ModalSubmitInteraction } from 'discord.js';
import { type } from 'arktype';

export const Modal = type({
  customId: CustomId,
  cooldown: 'number | boolean ?',
  preconditions: Precondition.array().optional(),
  execute:
    type('Function').as<(intr: ModalSubmitInteraction) => Promise<void>>(),
});
export type ModalInfer = typeof Modal.infer;
