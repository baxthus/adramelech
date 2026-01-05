'use server';

import { DefaultGetActions } from '@/schemas/actions';
import { protect } from '@/utils/auth';
import { ArkErrors } from 'arktype';
import { db } from 'database';
import { feedbacks } from 'database/schema';
import { desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { NanoID } from 'utils/types';
import { FeedbackStatus } from 'database/validations';
import type { FeedbackStatusInfer } from 'database/types';

const pageSize = 10;

export async function getFeedbacks(search?: string, page: number = 1) {
  await protect();

  const parsed = DefaultGetActions.assert({ search, page });

  let where: SQL | undefined;
  if (parsed.search) {
    const isNanoId = !(NanoID(parsed.search) instanceof ArkErrors);
    const isStatus = !(FeedbackStatus(parsed.search) instanceof ArkErrors);

    if (isNanoId)
      where = or(
        eq(feedbacks.id, parsed.search),
        eq(feedbacks.profileId, parsed.search),
      );
    else if (isStatus)
      where = eq(feedbacks.status, parsed.search as FeedbackStatusInfer);
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

  NanoID.assert(id);

  const result = await db.delete(feedbacks).where(eq(feedbacks.id, id));
  if (!result.rowCount) throw new Error('Feedback not found');
}
