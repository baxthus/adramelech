'use server';

import { protect } from '@/utils/auth';
import { db } from 'database';
import { feedbacks } from 'database/schema';
import { FeedbackStatus } from 'database/types';
import { eq } from 'drizzle-orm';
import z from 'zod';

export async function getFeedback(id: string) {
  await protect();

  z.nanoid().parse(id);

  const feedback = await db.query.feedbacks.findFirst({
    where: eq(feedbacks.id, id),
  });
  if (!feedback) throw new Error('Feedback not found');

  return feedback;
}

export async function setStatus(id: string, status: FeedbackStatus) {
  await protect();

  z.nanoid().parse(id);

  const feedback = await db
    .update(feedbacks)
    .set({ status })
    .where(eq(feedbacks.id, id));
  if (!feedback.rowCount) throw new Error('Feedback not found');
}
