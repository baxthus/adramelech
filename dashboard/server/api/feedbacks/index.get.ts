import db from 'database';
import { feedbackStatusesSchema, feedbacks } from 'database/schemas/schema';
import { desc, eq, ilike, inArray, or } from 'drizzle-orm';
import z from 'zod';

const schema = z.object({
  searchTerm: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const { searchTerm } = await getValidatedQuery(event, (query) =>
    schema.parse(query),
  );

  const isSearchTermAnUuid = z.uuid().safeParse(searchTerm).success;
  const idFilters = isSearchTermAnUuid
    ? or(eq(feedbacks.id, searchTerm!), eq(feedbacks.profileId, searchTerm!))
    : undefined;

  const { success: isStatus, data: status } =
    feedbackStatusesSchema.safeParse(searchTerm);
  const statusFilter = isStatus
    ? inArray(feedbacks.status, [status])
    : undefined;

  const searchFilter = searchTerm
    ? or(
        idFilters,
        statusFilter,
        ilike(feedbacks.title, `%${searchTerm}%`),
        ilike(feedbacks.content, `%${searchTerm}%`),
      )
    : undefined;

  return await db.query.feedbacks.findMany({
    orderBy: [desc(feedbacks.createdAt)],
    where: searchFilter,
  });
});
