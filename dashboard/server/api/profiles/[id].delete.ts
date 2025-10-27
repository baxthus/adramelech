import db from 'database';
import { profiles } from 'database/schemas/schema';
import { eq } from 'drizzle-orm';
import z from 'zod';

const schema = z.object({
  id: z.uuid(),
});

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, (params) =>
    schema.parse(params),
  );

  await db.delete(profiles).where(eq(profiles.id, id));
});
