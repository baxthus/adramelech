'use server';

import { protect } from '@/utils/auth';
import { conditionsToFilter } from '@/utils/db';
import db from 'database';
import {
  feedbacks,
  feedbackStatusesSchema,
  type FeedbackStatus,
} from 'database/schemas/schema';
import { desc, eq, ilike, type SQL } from 'drizzle-orm';
import z from 'zod';

const pageSize = 10;

export async function getFeedbacks(search?: string, page: number = 1) {
  await protect();

  const conditions: SQL[] = [];

  if (search) {
    const isUuid = z.uuid().safeParse(search).success;

    if (isUuid)
      conditions.push(
        eq(feedbacks.id, search),
        eq(feedbacks.profileId, search),
      );

    const isStatus = feedbackStatusesSchema.safeParse(search).success;
    if (isStatus) {
      conditions.push(eq(feedbacks.status, search as FeedbackStatus));
    }

    conditions.push(ilike(feedbacks.title, `%${search}%`));
  }

  const filter = conditionsToFilter(conditions);

  const offset = (page - 1) * pageSize;
  const totalCount = await db.$count(feedbacks, filter);
  const pageCount = Math.ceil(totalCount / pageSize);

  const data = await db.query.feedbacks.findMany({
    orderBy: [desc(feedbacks.createdAt)],
    where: filter,
    limit: pageSize,
    offset,
  });

  return {
    data,
    pageCount,
  };
}

export async function deleteFeedback(id: string) {
  await protect();

  const validId = z.uuid().parse(id);

  await db.delete(feedbacks).where(eq(feedbacks.id, validId));
}
