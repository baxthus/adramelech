import { CustomId } from './customId';
import { ComponentType, type MessageComponentInteraction } from 'discord.js';
import { Preconditions } from './precondition';
import { type } from 'arktype';
import { Hooks } from './hook';

export const Component = type({
  customId: CustomId,
  type: type.valueOf(ComponentType),
  cooldown: 'number | boolean ?',
  preconditions: Preconditions,
  hooks: Hooks,
  execute:
    type('Function').as<(intr: MessageComponentInteraction) => Promise<void>>(),
});
export type ComponentInfer = typeof Component.infer;
