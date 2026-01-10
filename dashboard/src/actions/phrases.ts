'use server';

import { protect } from '@/utils/auth';
import { desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { NanoID } from 'utils/types';
import { ArkErrors } from 'arktype';
import { phrases } from 'database/schema';
import { db } from 'database';
import type { PhraseCreateInfer } from 'database/types';
import { PhraseCreate } from 'database/validations';
import { DefaultGetActions, pageSize } from '@/definitions/actions';

export async function getPhrases(search?: string, page?: number) {
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

  const [data, totalCount] = await Promise.all([
    db.query.phrases.findMany({
      where,
      orderBy: [desc(phrases.createdAt)],
      offset,
      limit: pageSize,
    }),
    db.$count(phrases, where),
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
