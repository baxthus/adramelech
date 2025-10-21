'use server';
import { isAuthenticated } from '@/utils/auth';
import db from 'database';
import { phrases, type PhraseInsert } from 'database/schemas/schema';
import { desc, eq, ilike, or } from 'drizzle-orm';

export async function getPhrases(searchTerm?: string) {
  isAuthenticated();

  const searchFilter = searchTerm
    ? or(
        ilike(phrases.content, `%${searchTerm}%`),
        ilike(phrases.source, `%${searchTerm}%`),
      )
    : undefined;

  return await db.query.phrases.findMany({
    orderBy: [desc(phrases.createdAt)],
    where: searchFilter,
  });
}

export async function addPhrase(data: PhraseInsert) {
  isAuthenticated();

  await db.insert(phrases).values(data);
}

export async function deletePhrase(id: string) {
  isAuthenticated();

  await db.delete(phrases).where(eq(phrases.id, id));
}
