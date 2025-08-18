import type {
  AutocompleteInteraction,
  CommandInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import type { ComponentInteraction } from "~/events/interactionCreate";

export type Precondition = (
  interaction:
    | CommandInteraction
    | ComponentInteraction
    | ModalSubmitInteraction
    | AutocompleteInteraction, // Controversial
) => Promise<boolean>;
