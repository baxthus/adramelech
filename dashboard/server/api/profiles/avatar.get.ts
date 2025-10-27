import { getUserAvatar } from 'bot/src/external/user';
import z from 'zod';

const schema = z.object({
  discordId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { discordId } = await getValidatedQuery(event, (query) =>
    schema.parse(query),
  );

  return await getUserAvatar(discordId);
});
