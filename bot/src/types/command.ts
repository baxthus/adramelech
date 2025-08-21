import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import z from 'zod/v3';
import type { Precondition } from './precondition';

export const commandSchema = z.object({
  data: z.custom<SlashCommandBuilder | ContextMenuCommandBuilder>(),
  uses: z.array(z.string()).optional(),
  cooldown: z.union([z.number(), z.boolean()]).optional(),
  preconditions: z.array(z.custom<Precondition>()).optional(),
  execute: z
    .function()
    .args(z.custom<CommandInteraction>())
    .returns(z.promise(z.void())),
  autocomplete: z
    .function()
    .args(z.custom<AutocompleteInteraction>())
    .returns(z.promise(z.void()))
    .optional(),
});
export type Command = z.infer<typeof commandSchema>;

export type SubcommandExecutor = (
  intr: ChatInputCommandInteraction,
) => Promise<void>;
export type CommandExecutors = {
  [subcommand: string]: SubcommandExecutor;
};
export type CommandGroupExecutors = {
  [key: string]: SubcommandExecutor | CommandExecutors;
};
