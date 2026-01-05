import {
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  type CommandInteraction,
} from 'discord.js';
import { Precondition } from './precondition';
import { sendError } from '~/utils/sendError';
import { type } from 'arktype';

export const Command = type({
  data: type.or(
    type.instanceOf(SlashCommandBuilder),
    type.instanceOf(ContextMenuCommandBuilder),
  ),
  uses: 'string[]?',
  cooldown: 'number | boolean ?',
  preconditions: Precondition.array().optional(),
  execute: type('Function').as<(intr: CommandInteraction) => Promise<void>>(),
  autocomplete: type('Function')
    .as<(intr: AutocompleteInteraction) => Promise<void>>()
    .optional(),
});
export type CommandInfer = typeof Command.infer;

export type SubcommandExecutor = (
  intr: ChatInputCommandInteraction,
) => Promise<void>;
export type CommandExecutors = {
  [subcommand: string]: SubcommandExecutor;
};
export type CommandGroupExecutors = {
  [key: string]: SubcommandExecutor | CommandExecutors;
};

export async function executeCommandFromTree(
  tree: CommandGroupExecutors,
  intr: ChatInputCommandInteraction,
) {
  const groupName = intr.options.getSubcommandGroup(false);
  const subcommandName = intr.options.getSubcommand();

  let executor: SubcommandExecutor | undefined;

  if (groupName) {
    const group = tree[groupName];
    if (group && typeof group === 'object' && !Array.isArray(group))
      executor = group[subcommandName];
  } else {
    const directExecutor = tree[subcommandName];
    if (typeof directExecutor === 'function') executor = directExecutor;
  }

  if (executor) await executor(intr);
  else await sendError(intr, 'Unknown subcommand');
}
