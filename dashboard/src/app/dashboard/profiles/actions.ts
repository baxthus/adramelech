'use server';
import { isAuthenticated } from '@/utils/auth';
import db from 'database';
import { profiles } from 'database/schemas/schema';
import { desc, eq, ilike, or } from 'drizzle-orm';

export async function getProfiles(searchTerm?: string) {
  isAuthenticated();

  const searchFilter = searchTerm
    ? or(
        eq(profiles.discordId, searchTerm),
        ilike(profiles.nickname, `%${searchTerm}%`),
        ilike(profiles.bio, `%${searchTerm}%`),
      )
    : undefined;

  return await db.query.profiles.findMany({
    orderBy: [desc(profiles.createdAt)],
    where: searchFilter,
  });
}

export async function deleteProfile(id: string) {
  isAuthenticated();

  await db.delete(profiles).where(eq(profiles.id, id));
}
