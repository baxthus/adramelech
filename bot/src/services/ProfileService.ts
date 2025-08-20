import db from 'database';
import { and, eq, like } from 'drizzle-orm';
import { socialsLinks, users } from 'database/schemas/schema';

export class ProfileService {
  static async findUserProfile(
    discordId: string,
    withSocials: boolean = false,
  ) {
    return await db.query.users.findFirst({
      columns: { discord_id: false },
      where: eq(users.discord_id, discordId),
      with: {
        socials: withSocials
          ? {
              columns: { name: true, url: true },
            }
          : undefined,
      },
    });
  }

  static async createProfile(discordId: string) {
    return await db
      .insert(users)
      .values({ discord_id: discordId })
      .returning({ id: users.id })
      .onConflictDoNothing();
  }

  static async deleteProfile(discordId: string) {
    return await db
      .delete(users)
      .where(eq(users.discord_id, discordId))
      .returning({ id: users.id });
  }

  static async updateBio(discordId: string, bio: string | null) {
    return await db
      .update(users)
      .set({ bio })
      .where(eq(users.discord_id, discordId))
      .returning({ id: users.id });
  }

  static async updateNickname(discordId: string, nickname: string | null) {
    return await db
      .update(users)
      .set({ nickname })
      .where(eq(users.discord_id, discordId))
      .returning({ id: users.id });
  }

  static async findSocialLink(
    discordId: string,
    name: string,
    includeUrl: boolean = true,
    exactName: boolean = false,
  ) {
    const user = await db.query.users.findFirst({
      columns: { id: true },
      where: eq(users.discord_id, discordId),
      with: {
        socials: {
          columns: { name: true, url: includeUrl },
          where: exactName
            ? eq(socialsLinks.name, name)
            : like(socialsLinks.name, `%${name}%`),
        },
      },
    });
    return user?.socials ?? [];
  }

  static async addSocialLink(userId: number, name: string, url: string) {
    return await db
      .insert(socialsLinks)
      .values({ name, url, user_id: userId })
      .returning({ id: socialsLinks.id });
  }

  static async removeSocialLink(userId: number, name: string) {
    return await db
      .delete(socialsLinks)
      .where(and(eq(socialsLinks.user_id, userId), eq(socialsLinks.name, name)))
      .returning({ id: socialsLinks.id });
  }

  static async userExists(discordId: string): Promise<boolean> {
    return (await db.$count(users, eq(users.discord_id, discordId))) > 0;
  }
}
