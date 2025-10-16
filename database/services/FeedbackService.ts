import { and, eq, inArray, like, type SQL } from 'drizzle-orm';
import db from '..';
import { feedbacks, type FeedbackStatus } from '../schemas/schema';

/**
 * Service for managing user feedback
 */
export default class FeedbackService {
  /**
   * Find feedback by title
   * @param discordId The Discord ID of the user
   * @param title The title of the feedback
   * @param onlyBasic Whether to return only basic feedback information
   * @param filter Additional filters to apply
   * @returns The found feedback entries
   */
  static async findFeedbackByTitle(
    discordId: string,
    title: string,
    onlyBasic: boolean = false,
    statusList: Array<FeedbackStatus> | undefined = undefined
  ) {
    const statusFilter = statusList
      ? inArray(feedbacks.status, statusList)
      : undefined;

    return await db.query.feedbacks.findMany({
      columns: onlyBasic ? { id: true, title: true } : undefined,
      where: and(
        eq(feedbacks.user_id, discordId),
        like(feedbacks.title, `%${title}%`),
        statusFilter
      ),
    });
  }

  /**
   * Find feedback by ID
   * @param discordId The Discord ID of the user
   * @param feedbackId The ID of the feedback
   * @return The found feedback entry
   */
  static async findFeedbackById(discordId: string, feedbackId: number) {
    return await db.query.feedbacks.findFirst({
      where: and(
        eq(feedbacks.user_id, discordId),
        eq(feedbacks.id, feedbackId)
      ),
    });
  }

  /**
   * Create a new feedback entry
   * @param discordId The Discord ID of the user
   * @param title The title of the feedback
   * @param content The content of the feedback
   * @returns The created feedback entry (ID only)
   */
  static async createFeedback(
    discordId: string,
    title: string,
    content: string
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
   * Close a feedback entry
   * @param discordId The Discord ID of the user
   * @param feedbackId The ID of the feedback
   * @returns The closed feedback entry (ID only)
   */
  static async closeFeedback(discordId: string, feedbackId: number) {
    return await db
      .update(feedbacks)
      .set({ status: 'closed', updated_at: new Date() })
      .where(
        and(
          eq(feedbacks.user_id, discordId),
          eq(feedbacks.id, feedbackId),
          inArray(feedbacks.status, ['open', 'acknowledged'])
        )
      )
      .returning({ id: feedbacks.id });
  }
}
