import z from "zod/v3";
import { customId } from "./customId";
import type { ComponentType, MessageComponentInteraction } from "discord.js";
import type { Precondition } from "./precondition";

export const componentSchema = z.object({
  customId: customId,
  type: z.custom<ComponentType>(),
  cooldown: z.union([z.number(), z.boolean()]).optional(),
  preconditions: z.array(z.custom<Precondition>()).optional(),
  execute: z
    .function()
    .args(z.custom<MessageComponentInteraction>())
    .returns(z.promise(z.void())),
});
export type Component = z.infer<typeof componentSchema>;
