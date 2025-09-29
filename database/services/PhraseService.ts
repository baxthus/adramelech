import { sql } from "drizzle-orm";
import db from "..";

/**
 * Service for managing phrases
 */
export default class PhraseService {
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
}
