'use server';

import { protect } from '@/utils/auth';
import { prisma } from 'database';
import { FeedbackStatus } from 'database/generated/prisma/enums';
import { FeedbackWhereInput } from 'database/generated/prisma/models';
import { feedbackStatusSchema } from 'database/schemas';
import { conditionsToWhere } from 'database/utils';
import z from 'zod';

const pageSize = 10;

const schema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive(),
});

export async function getFeedbacks(search?: string, page: number = 1) {
  await protect();

  const parsed = schema.parse({ search, page });

  const conditions: FeedbackWhereInput[] = [];
  if (parsed.search) {
    const isNanoid = z.nanoid().safeParse(parsed.search).success;
    const isStatus = feedbackStatusSchema.safeParse(parsed.search).success;

    if (isNanoid)
      conditions.push({ id: parsed.search }, { profileId: parsed.search });
    else if (isStatus)
      conditions.push({ status: parsed.search as FeedbackStatus });
    else
      conditions.push({
        title: { contains: parsed.search, mode: 'insensitive' },
      });
  }

  const where = conditionsToWhere(conditions);
  const offset = (parsed.page - 1) * pageSize;

  const [totalCount, data] = await Promise.all([
    prisma.feedback.count({ where }),
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      omit: { content: true, response: true },
      skip: offset,
      take: pageSize,
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

  await prisma.feedback.delete({ where: { id } });
}
