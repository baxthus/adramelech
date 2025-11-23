'use server';

import z from 'zod';
import { prisma } from 'database';
import { protect } from '@/utils/auth';
import { conditionsToWhere } from 'database/utils';
import { phraseCreateSchema, type PhraseCreate } from 'database/schemas';
import type { PhraseWhereInput } from 'database/generated/prisma/models';

const pageSize = 10;

export async function getPhrases(search?: string, page: number = 1) {
  await protect();

  const conditions: PhraseWhereInput[] = [];

  if (search) {
    const isNanoid = z.nanoid().safeParse(search).success;
    if (isNanoid) conditions.push({ id: search });

    conditions.push(
      { content: { contains: search, mode: 'insensitive' } },
      { source: { contains: search, mode: 'insensitive' } },
    );
  }

  const where = conditionsToWhere(conditions);

  const offset = (page - 1) * pageSize;
  const totalCount = await prisma.phrase.count({ where });
  const pageCount = Math.ceil(totalCount / pageSize);

  const data = await prisma.phrase.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: pageSize,
  });

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
