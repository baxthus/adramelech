'use server';

import { DefaultGetActions } from '@/schemas/actions';
import { protect } from '@/utils/auth';
import { ArkErrors } from 'arktype';
import { db } from 'database';
import { phrases } from 'database/schema';
import type { PhraseCreateInfer } from 'database/types';
import { PhraseCreate } from 'database/validations';
import { desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { NanoID } from 'utils/types';

const pageSize = 10;

export async function getPhrases(search?: string, page: number = 1) {
  await protect();

  const parsed = DefaultGetActions.assert({ search, page });

  let where: SQL | undefined;
  if (parsed.search) {
    const isNanoId = !(NanoID(parsed.search) instanceof ArkErrors);
    if (isNanoId) where = eq(phrases.id, parsed.search);
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

export async function createPhrase(phrase: PhraseCreateInfer) {
  await protect();

  const data = PhraseCreate.assert(phrase);

  await db.insert(phrases).values(data);
}

export async function deletePhrase(id: string) {
  await protect();

  NanoID.assert(id);

  const result = await db.delete(phrases).where(eq(phrases.id, id));
  if (!result.rowCount) throw new Error('Phrase not found');
}
