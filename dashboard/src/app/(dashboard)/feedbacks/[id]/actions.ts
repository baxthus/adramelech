'use server';

import { protect } from '@/utils/auth';
import { db } from 'database';
import { feedbacks } from 'database/schema';
import { eq } from 'drizzle-orm';
import { feedbackFinalStates, statusTransitions } from './logic';
import { type } from 'arktype';
import { NanoID } from 'utils/types';
import { FeedbackStatus } from 'database/validations';
import type { FeedbackStatusInfer } from 'database/types';

export async function getFeedback(id: string) {
  await protect();

  NanoID.assert(id);

  const feedback = await db.query.feedbacks.findFirst({
    where: eq(feedbacks.id, id),
  });
  if (!feedback) throw new Error('Feedback not found');

  return feedback;
}

export async function setStatus(id: string, status: FeedbackStatusInfer) {
  await protect();

  NanoID.assert(id);
  FeedbackStatus.assert(status);

  const feedback = await db.query.feedbacks.findFirst({
    columns: { status: true },
    where: eq(feedbacks.id, id),
  });
  if (!feedback) throw new Error('Feedback not found');
  const availableTransitions = statusTransitions.get(feedback.status) ?? [];
  if (!availableTransitions.includes(status))
    throw new Error(
      `Invalid status transition from ${feedback.status} to ${status}`,
    );

  const result = await db
    .update(feedbacks)
    .set({ status })
    .where(eq(feedbacks.id, id));
  if (!result.rowCount) throw new Error('Feedback not found');
}

export async function setResponse(id: string, response: string) {
  await protect();

  NanoID.assert(id);
  type('string > 0').assert(response);

  const feedback = await db.query.feedbacks.findFirst({
    columns: { status: true },
    where: eq(feedbacks.id, id),
  });
  if (!feedback) throw new Error('Feedback not found');
  if (feedbackFinalStates.includes(feedback.status))
    throw new Error('Cannot set response for feedback in final state');

  const result = await db
    .update(feedbacks)
    .set({ response })
    .where(eq(feedbacks.id, id));
  if (!result.rowCount) throw new Error('Feedback not found');
}
