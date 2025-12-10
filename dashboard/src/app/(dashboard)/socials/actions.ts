'use server';

import { defaultGetActionsSchema } from '@/schemas/actions';
import { protect } from '@/utils/auth';
import { prisma } from 'database';
import type { SocialWhereInput } from 'database/generated/prisma/models';
import { conditionsToWhere } from 'database/utils';
import z from 'zod';

const pageSize = 10;

export async function getSocials(search?: string, page: number = 1) {
  await protect();

  const parsed = defaultGetActionsSchema.parse({ search, page });

  const conditions: SocialWhereInput[] = [];
  if (parsed.search) {
    const isNanoid = z.nanoid().safeParse(parsed.search).success;

    if (isNanoid) conditions.push({ id: parsed.search });
    else
      conditions.push(
        { name: { contains: parsed.search, mode: 'insensitive' } },
        // I'll have to trust that the bot is doing proper URL validation
        // Because I want full text search on URLs
        { url: { contains: parsed.search, mode: 'insensitive' } },
      );
  }

  const where = conditionsToWhere(conditions);
  const offset = (parsed.page - 1) * pageSize;

  const [totalCount, data] = await Promise.all([
    await prisma.social.count({ where }),
    await prisma.social.findMany({
      where,
      orderBy: { name: 'asc' },
      take: pageSize,
      skip: offset,
    }),
  ]);

  const pageCount = Math.ceil(totalCount / pageSize);

  return {
    data,
    pageCount,
  };
}

export async function deleteSocial(id: string) {
  await protect();

  z.nanoid().parse(id);

  await prisma.social.delete({ where: { id } });
}
