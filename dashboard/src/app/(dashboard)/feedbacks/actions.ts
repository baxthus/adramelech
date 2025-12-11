'use server';

import { defaultGetActionsSchema } from '@/schemas/actions';
import { protect } from '@/utils/auth';
import { db } from 'database';
import { feedbacks } from 'database/schema';
import type { FeedbackStatus } from 'database/types';
import { feedbackStatusSchema } from 'database/validations';
import { desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import z from 'zod';

const pageSize = 10;

export async function getFeedbacks(search?: string, page: number = 1) {
  await protect();

  const parsed = defaultGetActionsSchema.parse({ search, page });

  let where: SQL | undefined;
  if (parsed.search) {
    const isNanoid = z.nanoid().safeParse(parsed.search).success;
    const isStatus = feedbackStatusSchema.safeParse(parsed.search).success;

    if (isNanoid)
      where = or(
        eq(feedbacks.id, parsed.search),
        eq(feedbacks.profileId, parsed.search),
      );
    else if (isStatus)
      where = eq(feedbacks.status, parsed.search as FeedbackStatus);
    else where = ilike(feedbacks.title, `%${parsed.search}%`);
  }

  const offset = (parsed.page - 1) * pageSize;

  const [totalCount, data] = await Promise.all([
    db.$count(feedbacks, where),
    db.query.feedbacks.findMany({
      columns: {
        content: false,
        response: false,
      },
      where,
      orderBy: [desc(feedbacks.createdAt)],
      offset,
      limit: pageSize,
    }),
  ]);

  const pageCount = Math.ceil(totalCount / pageSize);

  return {
    data,
    pageCount,
  };
}

export async function deleteFeedback(id: string) {
  await protect();

  z.nanoid().parse(id);

  const result = await db.delete(feedbacks).where(eq(feedbacks.id, id));
  if (!result.rowCount) throw new Error('Feedback not found');
}
