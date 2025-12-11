'use server';

import { defaultGetActionsSchema } from '@/schemas/actions';
import { protect } from '@/utils/auth';
import { db } from 'database';
import { profiles } from 'database/schema';
import { desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import z from 'zod';

const pageSize = 10;

export async function getProfiles(search?: string, page: number = 1) {
  await protect();

  const parsed = defaultGetActionsSchema.parse({ search, page });

  let where: SQL | undefined;
  if (parsed.search) {
    const isNanoid = z.nanoid().safeParse(parsed.search).success;
    const isDiscordId = z.coerce
      .string()
      .min(17)
      .max(19)
      .safeParse(parsed.search).success;

    if (isNanoid) where = eq(profiles.id, parsed.search);
    else if (isDiscordId) where = eq(profiles.discordId, parsed.search);
    else
      where = or(
        ilike(profiles.nickname, `%${parsed.search}%`),
        ilike(profiles.bio, `%${parsed.search}%`),
      );
  }

  const offset = (parsed.page - 1) * pageSize;

  const [totalCount, data] = await Promise.all([
    db.$count(profiles, where),
    db.query.profiles.findMany({
      where,
      orderBy: [desc(profiles.createdAt)],
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

export async function deleteProfile(id: string) {
  await protect();

  z.nanoid().parse(id);

  const result = await db.delete(profiles).where(eq(profiles.id, id));
  if (!result.rowCount) throw new Error('Profile not found');
}
