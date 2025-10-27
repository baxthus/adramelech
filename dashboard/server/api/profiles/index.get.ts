import db from 'database';
import { profiles } from 'database/schemas/schema';
import { desc, eq, ilike, or } from 'drizzle-orm';
import z from 'zod';

const schema = z.object({
  searchTerm: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const { searchTerm } = await getValidatedQuery(event, (query) =>
    schema.parse(query),
  );

  const isSearchTermAnUuid = z.uuid().safeParse(searchTerm).success;
  const idFilter = isSearchTermAnUuid
    ? eq(profiles.id, searchTerm!)
    : undefined;

  const searchFilter = searchTerm
    ? or(
        idFilter,
        eq(profiles.discordId, searchTerm),
        ilike(profiles.nickname, `%${searchTerm}%`),
        ilike(profiles.bio, `%${searchTerm}%`),
      )
    : undefined;

  return await db.query.profiles.findMany({
    orderBy: [desc(profiles.createdAt)],
    where: searchFilter,
  });
});
