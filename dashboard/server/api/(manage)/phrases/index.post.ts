import db from 'database';
import { phraseInsertSchema, phrases } from 'database/schemas/schema';
import { protectRoute } from '~~/server/utlis/auth';

export default defineEventHandler(async (event) => {
  protectRoute(event.context.auth());

  const data = await readValidatedBody(event, (body) =>
    phraseInsertSchema.parse(body),
  );

  await db.insert(phrases).values(data);
  return { success: true };
});
