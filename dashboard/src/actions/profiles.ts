'use server';

import { DefaultGetActions, pageSize } from '@/definitions/actions';
import { protect } from '@/utils/auth';
import { type } from 'arktype';
import { db } from 'database';
import { profiles } from 'database/schema';
import { desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { NanoID } from 'utils/types';

export async function getProfiles(search?: string, page?: number) {
  await protect();

  const parsed = DefaultGetActions.assert({ search, page });

  let where: SQL | undefined;
  if (parsed.search) {
    const isNanoId = !(NanoID(parsed.search) instanceof type.errors);
    const isDiscordId = !(
      type('17 <= string <= 19')(parsed.search) instanceof type.errors
    );

    if (isNanoId) where = eq(profiles.id, parsed.search);
    else if (isDiscordId) where = eq(profiles.discordId, parsed.search);
    else
      where = or(
        ilike(profiles.nickname, `%${parsed.search}%`),
        ilike(profiles.bio, `%${parsed.search}%`),
      );
  }

  const offset = (parsed.page - 1) * pageSize;

  const [data, totalCount] = await Promise.all([
    db.query.profiles.findMany({
      where,
      orderBy: [desc(profiles.createdAt)],
      offset,
      limit: pageSize,
    }),
    db.$count(profiles, where),
  ]);

  const pageCount = Math.ceil(totalCount / pageSize);

  return {
    data,
    pageCount,
  };
}

export async function deleteProfile(id: string) {
  await protect();

  NanoID.assert(id);

  const result = await db.delete(profiles).where(eq(profiles.id, id));
  if (!result.rowCount) throw new Error('Profile not found');
}
