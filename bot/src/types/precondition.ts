import { type } from 'arktype';
import type {
  AutocompleteInteraction,
  CommandInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import type { ComponentInteraction } from '~/events/interactionCreate';

export const Precondition =
  type('Function').as<
    (
      interaction:
        | CommandInteraction
        | ComponentInteraction
        | ModalSubmitInteraction
        | AutocompleteInteraction,
    ) => Promise<void>
  >();
