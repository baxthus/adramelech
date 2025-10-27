import db from 'database';
import { phraseInsertSchema, phrases } from 'database/schemas/schema';

export default defineEventHandler(async (event) => {
  const data = await readValidatedBody(event, (body) =>
    phraseInsertSchema.parse(body),
  );

  await db.insert(phrases).values(data);
  return { success: true };
});
