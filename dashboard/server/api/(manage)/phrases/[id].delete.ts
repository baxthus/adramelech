import db from 'database';
import { phrases } from 'database/schemas/schema';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { protectRoute } from '~~/server/utlis/auth';

const schema = z.object({
  id: z.uuid(),
});

export default defineEventHandler(async (event) => {
  protectRoute(event.context.auth);

  const { id } = await getValidatedRouterParams(event, (params) =>
    schema.parse(params),
  );

  await db.delete(phrases).where(eq(phrases.id, id));
  return { success: true };
});
