import { type } from 'arktype';
import type { ModalSubmitInteraction } from 'discord.js';
import type {
  CommandInteraction,
  ComponentInteraction,
} from '~/events/interactionCreate';

type ProperInteraction =
  | CommandInteraction
  | ComponentInteraction
  | ModalSubmitInteraction;

export const Hooks = type({
  before: type('Function')
    .as<(intr: ProperInteraction) => Promise<void>>()
    .optional(),
  after: type('Function')
    .as<(intr: ProperInteraction, success: boolean) => Promise<void>>()
    .optional(),
}).optional();
