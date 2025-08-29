import { and, eq, like } from 'drizzle-orm';
import db from '..';
import { socialsLinks, users } from '../schemas/schema';

/**
 * Service for managing user socials
 */
export default class SocialsService {
  /**
   * List all social links for a user by their Discord ID
   * @param discordId The Discord ID of the user
   * @returns An array of social links
   */
  static async listSocialsByDiscordId(discordId: string) {
    const data = await db.query.users.findFirst({
      columns: {},
      where: eq(users.discord_id, discordId),
      with: {
        socials: {
          columns: { id: false, user_id: false },
        },
      },
    });
    return data?.socials ?? [];
  }

  /**
   * Find all social links for a user by their Discord ID
   * @param discordId The Discord ID of the user
   * @param name The name of the social platform
   * @param includeUrl Whether to include the URL in the response
   * @param exactName Whether to match the name exactly
   * @returns An array of social links
   */
  static async findSocialsByName(
    discordId: string,
    name: string,
    includeUrl: boolean = true,
    exactName: boolean = false
  ) {
    const data = await db.query.users.findFirst({
      columns: {},
      where: eq(users.discord_id, discordId),
      with: {
        socials: {
          columns: { id: true, name: true, url: includeUrl },
          where: exactName
            ? eq(socialsLinks.name, name)
            : like(socialsLinks.name, `%${name}%`),
        },
      },
    });
    return data?.socials ?? [];
  }

  /**
   * Create a new social link for a user
   * @param userId The ID of the user
   * @param name The name of the social platform
   * @param url The URL of the social profile
   * @returns The created social link
   */
  static async createSocial(userId: number, name: string, url: string) {
    return await db
      .insert(socialsLinks)
      .values({ user_id: userId, name, url })
      .returning({ id: socialsLinks.id });
  }

  /**
   * Delete a social link for a user
   * @param userId The ID of the user
   * @param socialId The ID of the social link
   * @returns The deleted social link
   */
  static async deleteSocial(userId: number, socialId: number) {
    return await db
      .delete(socialsLinks)
      .where(
        and(eq(socialsLinks.user_id, userId), eq(socialsLinks.id, socialId))
      )
      .returning({ id: socialsLinks.id });
  }
}
