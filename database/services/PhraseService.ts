import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import db from '..';
import { phrases } from '../schemas/schema';

/**
 * Service for managing phrases
 */
export default class PhraseService {
  /**
   * Get phrases, optionally filtered by a search term
   * @param searchTerm Optional search term to filter phrases by content or source
   * @returns List of phrases matching the criteria
   */
  static async getPhrases(searchTerm?: string) {
    const searchFilter = searchTerm
      ? and(
          ilike(phrases.content, `%${searchTerm}%`),
          ilike(phrases.source, `%${searchTerm}%`)
        )
      : undefined;

    return await db.query.phrases.findMany({
      orderBy: [desc(phrases.created_at)],
      where: searchFilter,
    });
  }

  /**
   * Get a random phrase
   * @returns A random phrase entry
   */
  static async getRandomPhrase() {
    return await db.query.phrases.findFirst({
      columns: { id: false },
      orderBy: sql`RANDOM()`,
    });
  }

  /**
   * Delete a phrase by its ID
   * @param id ID of the phrase to delete
   * @returns The ID of the deleted phrase
   */
  static async deletePhrase(id: number) {
    return await db
      .delete(phrases)
      .where(eq(phrases.id, id))
      .returning({ id: phrases.id });
  }
}
