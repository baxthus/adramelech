'use server';

import { defaultGetActionsSchema } from '@/schemas/actions';
import { protect } from '@/utils/auth';
import { db } from 'database';
import { phrases } from 'database/schema';
import type { PhraseCreate } from 'database/types';
import { phraseCreateSchema } from 'database/validations';
import { desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import z from 'zod';

const pageSize = 10;

export async function getPhrases(search?: string, page: number = 1) {
  await protect();

  const parsed = defaultGetActionsSchema.parse({ search, page });

  let where: SQL | undefined;
  if (parsed.search) {
    const isNanoid = z.nanoid().safeParse(parsed.search).success;
    if (isNanoid) where = eq(phrases.id, parsed.search);
    else
      where = or(
        ilike(phrases.content, `%${parsed.search}%`),
        ilike(phrases.source, `%${parsed.search}%`),
      );
  }

  const offset = (parsed.page - 1) * pageSize;

  const [totalCount, data] = await Promise.all([
    db.$count(phrases, where),
    db.query.phrases.findMany({
      where,
      orderBy: [desc(phrases.createdAt)],
      offset,
      limit: pageSize,
    }),
  ]);

  const pageCount = Math.ceil(totalCount / pageSize);

  return {
    data,
    pageCount,
  };
}

export async function createPhrase(phrase: PhraseCreate) {
  await protect();

  const data = phraseCreateSchema.parse(phrase);

  await db.insert(phrases).values(data);
}

export async function deletePhrase(id: string) {
  await protect();

  z.nanoid().parse(id);

  const result = await db.delete(phrases).where(eq(phrases.id, id));
  if (!result.rowCount) throw new Error('Phrase not found');
}
