'use server';

import { protect } from '@/utils/auth';
import { prisma } from 'database';
import type { FeedbackStatus } from 'database/generated/prisma/enums';
import type { FeedbackWhereInput } from 'database/generated/prisma/models';
import { feedbackStatusSchema } from 'database/schemas';
import { conditionsToWhere } from 'database/utils';
import z from 'zod';

const pageSize = 10;

export async function getFeedbacks(search?: string, page: number = 1) {
  await protect();

  const conditions: FeedbackWhereInput[] = [];

  if (search) {
    const isNanoid = z.nanoid().safeParse(search).success;
    if (isNanoid) conditions.push({ id: search }, { profileId: search });

    const isStatus = feedbackStatusSchema.safeParse(search).success;
    if (isStatus) conditions.push({ status: search as FeedbackStatus });

    conditions.push({ title: { contains: search, mode: 'insensitive' } });
  }

  const where = conditionsToWhere(conditions);

  const offset = (page - 1) * pageSize;
  const totalCount = await prisma.feedback.count({ where });
  const pageCount = Math.ceil(totalCount / pageSize);

  const data = await prisma.feedback.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: pageSize,
    skip: offset,
  });

  return {
    data,
    pageCount,
  };
}

export async function deleteFeedback(id: string) {
  await protect();

  z.nanoid().parse(id);

  await prisma.feedback.delete({ where: { id } });
}
