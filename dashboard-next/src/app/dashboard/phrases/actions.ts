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

export async function getPhrases(searchTerm?: string) {
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

  return await db.query.phrases.findMany({
    orderBy: [desc(phrases.createdAt)],
    where: searchFilter,
  });
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
