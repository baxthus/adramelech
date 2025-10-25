import { protectRoute } from '~~/server/utlis/auth';
import { z } from 'zod';
import { desc, ilike, or } from 'drizzle-orm';
import { phrases } from 'database/schemas/schema';
import db from 'database';

const schema = z.object({
  searchTerm: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  protectRoute(event.context.auth);

  const { searchTerm } = await getValidatedQuery(event, (query) =>
    schema.parse(query),
  );

  const searchFilter = searchTerm
    ? or(
        ilike(phrases.content, `%${searchTerm}%`),
        ilike(phrases.source, `%${searchTerm}%`),
      )
    : undefined;

  return await db.query.phrases.findMany({
    orderBy: [desc(phrases.createdAt)],
    where: searchFilter,
  });
});
