import type {
  AutocompleteInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import type {
  CommandInteraction,
  ComponentInteraction,
} from '#bot/events/interactionCreate';

export type Precondition = (
  interaction:
    | CommandInteraction
    | ComponentInteraction
    | ModalSubmitInteraction
    | AutocompleteInteraction, // Controversial
) => Promise<boolean>;
