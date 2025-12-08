'use server';

import { defaultGetActionsSchema } from '@/schemas/actions';
import { protect } from '@/utils/auth';
import { prisma } from 'database';
import type { ProfileWhereInput } from 'database/generated/prisma/models';
import { conditionsToWhere } from 'database/utils';
import z from 'zod';

const pageSize = 10;

export async function getProfiles(search?: string, page: number = 1) {
  await protect();

  const parsed = defaultGetActionsSchema.parse({ search, page });

  const conditions: ProfileWhereInput[] = [];
  if (parsed.search) {
    const isNanoid = z.nanoid().safeParse(parsed.search).success;
    const isDiscordId = z.coerce
      .string()
      .min(17)
      .max(19)
      .safeParse(parsed.search).success;

    if (isNanoid) conditions.push({ id: parsed.search });
    else if (isDiscordId) conditions.push({ discordId: parsed.search });
    else
      conditions.push(
        { nickname: { contains: parsed.search, mode: 'insensitive' } },
        { bio: { contains: parsed.search, mode: 'insensitive' } },
      );
  }

  const where = conditionsToWhere(conditions);
  const offset = (parsed.page - 1) * pageSize;

  const [totalCount, data] = await Promise.all([
    await prisma.profile.count({ where }),
    await prisma.profile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      omit: { bio: true },
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

export async function deleteProfile(id: string) {
  await protect();

  z.nanoid().parse(id);

  await prisma.profile.delete({ where: { id } });
}
