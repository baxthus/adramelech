'use server';

import z from 'zod';
import { desc, eq, ilike, or } from 'drizzle-orm';
import { phrases } from 'database/schemas/schema';
import db from 'database';

export async function getPhrases(searchTerm?: string) {
  const isSearchTermAnUuid = z.uuid().safeParse(searchTerm).success;
  const idFilter = isSearchTermAnUuid ? eq(phrases.id, searchTerm!) : undefined;

  const searchFilter = searchTerm
    ? or(
        idFilter,
        ilike(phrases.content, `%${searchTerm}%`),
        ilike(phrases.source, `%${searchTerm}%`),
      )
    : undefined;

  return await db.query.phrases.findMany({
    orderBy: [desc(phrases.createdAt)],
    where: searchFilter,
  });
}
