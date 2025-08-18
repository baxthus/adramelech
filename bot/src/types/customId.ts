import z from "zod/v3";

export const customId = z
  .string()
  .min(1)
  .max(100)
  // Allows one or more lowercase letters or digits
  // Allows zero or more groups of a hyphen followed by one or more lowercase letters or digits
  // The pattern still prevents starting or ending with a hyphen and disallows consecutive hyphens
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
