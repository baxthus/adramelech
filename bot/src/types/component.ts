import { CustomId } from './customId';
import { ComponentType, type MessageComponentInteraction } from 'discord.js';
import { Precondition } from './precondition';
import { type } from 'arktype';

export const Component = type({
  customId: CustomId,
  type: type.valueOf(ComponentType),
  cooldown: 'number | boolean ?',
  preconditions: Precondition.array().optional(),
  execute:
    type('Function').as<(intr: MessageComponentInteraction) => Promise<void>>(),
});
export type ComponentInfer = typeof Component.infer;
