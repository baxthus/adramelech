import { sql } from 'drizzle-orm';
import db from '..';

export default class PhraseService {
  static async getRandomPhrase() {
    return await db.query.phrases.findFirst({
      columns: { id: false },
      orderBy: sql`RANDOM()`,
    });
  }
}
