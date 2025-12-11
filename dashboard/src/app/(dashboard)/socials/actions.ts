'use server';

import { defaultGetActionsSchema } from '@/schemas/actions';
import { protect } from '@/utils/auth';
import { db } from 'database';
import { socials } from 'database/schema';
import { asc, eq, ilike, or, type SQL } from 'drizzle-orm';
import z from 'zod';

const pageSize = 10;

export async function getSocials(search?: string, page: number = 1) {
  await protect();

  const parsed = defaultGetActionsSchema.parse({ search, page });

  let where: SQL | undefined;
  if (parsed.search) {
    const isNanoid = z.nanoid().safeParse(parsed.search).success;

    if (isNanoid)
      where = or(
        eq(socials.id, parsed.search),
        eq(socials.profileId, parsed.search),
      );
    else
      where = or(
        ilike(socials.name, `%${parsed.search}%`),
        // I'll have to trust that the bot is doing proper URL validation
        // Because I want full text search on URLs
        ilike(socials.url, `%${parsed.search}%`),
      );
  }

  const offset = (parsed.page - 1) * pageSize;

  const [totalCount, data] = await Promise.all([
    db.$count(socials, where),
    db.query.socials.findMany({
      where,
      orderBy: [asc(socials.name)],
      limit: pageSize,
      offset,
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

  const result = await db.delete(socials).where(eq(socials.id, id));
  if (!result.rowCount) throw new Error('Social not found');
}
