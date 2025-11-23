'use server';

import { protect } from '@/utils/auth';
import { prisma } from 'database';
import type { PhraseWhereInput } from 'database/generated/prisma/models';
import { phraseCreateSchema, type PhraseCreate } from 'database/schemas';
import { conditionsToWhere } from 'database/utils';
import z from 'zod';

const pageSize = 10;

const schema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive(),
});

export async function getPhrases(search?: string, page: number = 1) {
  await protect();

  const parsed = schema.parse({ search, page });

  const conditions: PhraseWhereInput[] = [];
  if (parsed.search) {
    const isNanoid = z.nanoid().safeParse(parsed.search).success;
    if (isNanoid) conditions.push({ id: parsed.search });
    else
      conditions.push(
        { content: { contains: parsed.search, mode: 'insensitive' } },
        { source: { contains: parsed.search, mode: 'insensitive' } },
      );
  }

  const where = conditionsToWhere(conditions);
  const offset = (parsed.page - 1) * pageSize;

  const [totalCount, data] = await Promise.all([
    await prisma.phrase.count({ where }),
    await prisma.phrase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: pageSize,
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

  await prisma.phrase.create({ data });
}

export async function deletePhrase(id: string) {
  await protect();

  z.nanoid().parse(id);

  await prisma.phrase.delete({ where: { id } });
}
