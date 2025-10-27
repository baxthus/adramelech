import { getUserAvatar } from 'bot/src/external/user';
import db from 'database';
import { profiles } from 'database/schemas/schema';
import { eq } from 'drizzle-orm';
import z from 'zod';

const schema = z.object({
  id: z.uuid(),
});

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, (params) =>
    schema.parse(params),
  );

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, id),
  });
  if (!profile)
    throw createError({ statusCode: 404, message: 'Profile not found' });

  return {
    ...profile,
    avatar: await getUserAvatar(profile.discordId),
  };
});
