import { type } from 'arktype';
import type {
  AutocompleteInteraction,
  CommandInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import type { ComponentInteraction } from '~/events/interactionCreate';

export const Preconditions = type('Function')
  .as<
    (
      interaction:
        | CommandInteraction
        | ComponentInteraction
        | ModalSubmitInteraction
        | AutocompleteInteraction,
    ) => Promise<void>
  >()
  .array()
  .optional();
