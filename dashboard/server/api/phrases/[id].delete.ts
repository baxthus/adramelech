import db from 'database';
import { phrases } from 'database/schemas/schema';
import { eq } from 'drizzle-orm';
import z from 'zod';

const schema = z.object({
  id: z.uuid(),
});

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, (params) =>
    schema.parse(params),
  );

  await db.delete(phrases).where(eq(phrases.id, id));
  return { success: true };
});
