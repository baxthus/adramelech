import db from 'database';
import { feedbacks, users } from 'database/schemas/schema';
import { and, eq, inArray, like, type SQL } from 'drizzle-orm';

/**
 * Feedback service for managing user feedback
 */
export class FeedbackService {
  /**
   * Find feedback by title
   * @param discordId The Discord ID of the user
   * @param title The title of the feedback
   * @param onlyBasic Whether to only return basic feedback information
   * @param filter Additional filters to apply to the feedback search
   * @returns The found feedback entries
   */
  static async findFeedbackByTitle(
    discordId: string,
    title: string,
    onlyBasic: boolean = false,
    filter: SQL | undefined = undefined,
  ) {
    const data = await db.query.users.findFirst({
      columns: {},
      where: eq(users.discord_id, discordId),
      with: {
        feedbacks: {
          columns: onlyBasic ? { id: true, title: true } : undefined,
          where: and(filter, like(feedbacks.title, `%${title}%`)),
        },
      },
    });
    return data?.feedbacks ?? [];
  }

  /**
   * Find feedback by ID
   * @param discordId The Discord ID of the user
   * @param feedbackId The ID of the feedback
   * @returns The found feedback entry or null if not found
   */
  static async findFeedbackById(discordId: string, feedbackId: number) {
    const data = await db.query.users.findFirst({
      columns: {},
      where: eq(users.discord_id, discordId),
      with: {
        feedbacks: {
          where: eq(feedbacks.id, feedbackId),
        },
      },
    });
    return data?.feedbacks[0] ?? null;
  }

  /**
   * Creates a new feedback entry
   * @param discordId The Discord ID of the user
   * @param title The title of the feedback
   * @param content The content of the feedback
   * @returns The ID of the created feedback
   */
  static async createFeedback(
    discordId: string,
    title: string,
    content: string,
  ) {
    return await db
      .insert(feedbacks)
      .values({
        user_id: discordId,
        title,
        content,
      })
      .returning({ id: feedbacks.id });
  }

  /**
   * Closes a feedback entry
   * @param discordId The Discord ID of the user
   * @param feedbackId The ID of the feedback to close
   * @returns The ID of the closed feedback
   */
  static async closeFeedback(discordId: string, feedbackId: number) {
    return await db
      .update(feedbacks)
      .set({ status: 'closed', updated_at: new Date() })
      .where(
        and(
          eq(feedbacks.id, feedbackId),
          eq(feedbacks.user_id, discordId),
          inArray(feedbacks.status, ['open', 'acknowledged']),
        ),
      )
      .returning({ id: feedbacks.id });
  }
}
