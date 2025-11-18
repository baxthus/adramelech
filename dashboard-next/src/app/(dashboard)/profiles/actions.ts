'use server';

import { protect } from '@/utils/auth';
import db from 'database';
import { profiles } from 'database/schemas/schema';
import { desc, eq, ilike, or } from 'drizzle-orm';
import z from 'zod';

const pageSize = 10;

export async function getProfiles(searchTerm?: string, page: number = 1) {
  await protect();

  const isSearchTermAnUuid = z.uuid().safeParse(searchTerm).success;
  const idFilter = isSearchTermAnUuid
    ? eq(profiles.id, searchTerm!)
    : undefined;

  const isDiscordId = z.coerce
    .string()
    .length(19)
    .safeParse(searchTerm).success;
  const discordIdFilter = isDiscordId
    ? eq(profiles.discordId, searchTerm!)
    : undefined;

  const searchFilter = searchTerm
    ? or(
        idFilter,
        discordIdFilter,
        ilike(profiles.nickname, `%${searchTerm}%`),
        ilike(profiles.bio, `%${searchTerm}%`),
      )
    : undefined;

  const offset = (page - 1) * pageSize;
  const totalCount = await db.$count(profiles, searchFilter);
  const pageCount = Math.ceil(totalCount / pageSize);

  const data = await db.query.profiles.findMany({
    orderBy: [desc(profiles.createdAt)],
    where: searchFilter,
    limit: pageSize,
    offset,
  });

  return {
    data,
    pageCount,
    pageIndex: page,
  };
}

export async function deleteProfile(id: string) {
  await protect();

  const validId = z.uuid().parse(id);

  await db.delete(profiles).where(eq(profiles.id, validId));
}
