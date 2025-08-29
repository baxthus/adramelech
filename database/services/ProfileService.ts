import { eq } from 'drizzle-orm';
import db from '..';
import { users } from '../schemas/schema';

/**
 * Service for managing user profiles
 */
export default class ProfileService {
  /**
   * Find a profile by Discord ID
   * @param discordId The Discord ID of the user
   * @returns The found profile entry
   */
  static async findProfileByDiscordId(discordId: string) {
    return await db.query.users.findFirst({
      columns: { discord_id: false },
      where: eq(users.discord_id, discordId),
    });
  }

  /**
   * Create a new profile
   * @param discordId The Discord ID of the user
   * @returns The created profile entry (ID only)
   */
  static async createProfile(discordId: string) {
    return await db
      .insert(users)
      .values({ discord_id: discordId })
      .returning({ id: users.id })
      .onConflictDoNothing();
  }

  /**
   * Delete a profile
   * @param discordId The Discord ID of the user
   * @returns The deleted profile entry (ID only)
   */
  static async deleteProfile(discordId: string) {
    return await db
      .delete(users)
      .where(eq(users.discord_id, discordId))
      .returning({ id: users.id });
  }

  /**
   * Update a profile
   * @param discordId The Discord ID of the user
   * @param data The updated profile data
   * @returns The updated profile entry (ID only)
   */
  static async updateProfile(
    discordId: string,
    data: Partial<{ nickname: string | null; bio: string | null }>
  ) {
    return await db
      .update(users)
      .set(data)
      .where(eq(users.discord_id, discordId))
      .returning({ id: users.id });
  }

  /**
   * Check if a user exists by Discord ID
   * @param discordId The Discord ID of the user
   * @returns True if the user exists, false otherwise
   */
  static async userExists(discordId: string) {
    return (await db.$count(users, eq(users.discord_id, discordId))) > 0;
  }
}
