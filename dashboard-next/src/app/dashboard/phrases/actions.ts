'use server';

import z from 'zod';
import { desc, eq, ilike, or } from 'drizzle-orm';
import {
  phraseInsertSchema,
  phrases,
  type PhraseInsert,
} from 'database/schemas/schema';
import db from 'database';
import { protect } from '@/utils/auth';

const pageSize = 10;

export async function getPhrases(searchTerm?: string, page: number = 1) {
  await protect();

  const isSearchTermAnUuid = z.uuid().safeParse(searchTerm).success;
  const idFilter = isSearchTermAnUuid ? eq(phrases.id, searchTerm!) : undefined;

  const searchFilter = searchTerm
    ? or(
        idFilter,
        ilike(phrases.content, `%${searchTerm}%`),
        ilike(phrases.source, `%${searchTerm}%`),
      )
    : undefined;

  const offset = (page - 1) * pageSize;
  const totalCount = await db.$count(phrases, searchFilter);
  const pageCount = Math.ceil(totalCount / pageSize);

  const data = await db.query.phrases.findMany({
    orderBy: [desc(phrases.createdAt)],
    where: searchFilter,
    limit: pageSize,
    offset,
  });

  return {
    data,
    pageCount,
    pageIndex: page,
  };
}

export async function createPhrase(phrase: PhraseInsert) {
  await protect();

  const validPhrase = phraseInsertSchema.parse(phrase);

  await db.insert(phrases).values(validPhrase);
}

export async function deletePhrase(id: string) {
  await protect();

  const validId = z.uuid().parse(id);

  await db.delete(phrases).where(eq(phrases.id, validId));
}
