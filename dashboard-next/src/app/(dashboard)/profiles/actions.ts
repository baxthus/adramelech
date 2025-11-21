'use server';

import { protect } from '@/utils/auth';
import { conditionsToFilter } from '@/utils/db';
import db from 'database';
import { profiles } from 'database/schemas/schema';
import { desc, eq, ilike, type SQL } from 'drizzle-orm';
import z from 'zod';

const pageSize = 10;

export async function getProfiles(search?: string, page: number = 1) {
  await protect();

  const conditions: SQL[] = [];

  if (search) {
    const isUuid = z.uuid().safeParse(search).success;
    if (isUuid) conditions.push(eq(profiles.id, search));

    const isDiscordId = z.coerce.string().length(19).safeParse(search).success;
    if (isDiscordId) conditions.push(eq(profiles.discordId, search));

    conditions.push(
      ilike(profiles.nickname, `%${search}%`),
      ilike(profiles.bio, `%${search}%`),
    );
  }

  const filter = conditionsToFilter(conditions);

  const offset = (page - 1) * pageSize;
  const totalCount = await db.$count(profiles, filter);
  const pageCount = Math.ceil(totalCount / pageSize);

  const data = await db.query.profiles.findMany({
    orderBy: [desc(profiles.createdAt)],
    where: filter,
    limit: pageSize,
    offset,
  });

  return {
    data,
    pageCount,
  };
}

export async function deleteProfile(id: string) {
  await protect();

  const validId = z.uuid().parse(id);

  await db.delete(profiles).where(eq(profiles.id, validId));
}
