'use server';

import z from 'zod';
import { desc, eq, ilike, type SQL } from 'drizzle-orm';
import {
  phraseInsertSchema,
  phrases,
  type PhraseInsert,
} from 'database/schemas/schema';
import db from 'database';
import { protect } from '@/utils/auth';
import { conditionsToFilter } from '@/utils/db';

const pageSize = 10;

export async function getPhrases(search?: string, page: number = 1) {
  await protect();

  const conditions: SQL[] = [];

  if (search) {
    const isSearchTermAnUuid = z.uuid().safeParse(search).success;
    if (isSearchTermAnUuid) conditions.push(eq(phrases.id, search));

    conditions.push(
      ilike(phrases.content, `%${search}%`),
      ilike(phrases.source, `%${search}%`),
    );
  }

  const filter = conditionsToFilter(conditions);

  const offset = (page - 1) * pageSize;
  const totalCount = await db.$count(phrases, filter);
  const pageCount = Math.ceil(totalCount / pageSize);

  const data = await db.query.phrases.findMany({
    orderBy: [desc(phrases.createdAt)],
    where: filter,
    limit: pageSize,
    offset,
  });

  return {
    data,
    pageCount,
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
