'use server';

import { protect } from '@/utils/auth';
import { prisma } from 'database';
import type { ProfileWhereInput } from 'database/generated/prisma/models';
import { conditionsToWhere } from 'database/utils';
import z from 'zod';

const pageSize = 10;

export async function getProfiles(search?: string, page: number = 1) {
  await protect();

  const conditions: ProfileWhereInput[] = [];

  if (search) {
    const isNanoid = z.nanoid().safeParse(search).success;
    if (isNanoid) conditions.push({ id: search });

    const isDiscordId = z.coerce.string().length(19).safeParse(search).success;
    if (isDiscordId) conditions.push({ discordId: search });

    conditions.push(
      { nickname: { contains: search, mode: 'insensitive' } },
      { bio: { contains: search, mode: 'insensitive' } },
    );
  }

  const where = conditionsToWhere(conditions);

  const offset = (page - 1) * pageSize;
  const totalCount = await prisma.profile.count({ where });
  const pageCount = Math.ceil(totalCount / pageSize);

  const data = await prisma.profile.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: pageSize,
    skip: offset,
  });

  return {
    data,
    pageCount,
  };
}

export async function deleteProfile(id: string) {
  await protect();

  z.nanoid().parse(id);

  await prisma.profile.delete({ where: { id } });
}
