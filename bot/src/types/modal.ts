import { CustomId } from './customId';
import { Preconditions } from './precondition';
import type { ModalSubmitInteraction } from 'discord.js';
import { type } from 'arktype';
import { Hooks } from './hook';

export const Modal = type({
  customId: CustomId,
  cooldown: 'number | boolean ?',
  preconditions: Preconditions,
  hooks: Hooks,
  execute:
    type('Function').as<(intr: ModalSubmitInteraction) => Promise<void>>(),
});
export type ModalInfer = typeof Modal.infer;
