import db from '#db';
import { configSchema } from '#db/schema';
import Elysia, { t } from 'elysia';

export default new Elysia({ prefix: 'test' })
  .post(
    '/',
    async ({ body }) => {
      const response = await db.insert(configSchema).values(body);
      return JSON.stringify(response);
    },
    {
      body: t.Object({
        key: t.String(),
        value: t.String(),
      }),
    }
  )
  .get('/', async () => {
    const response = await db.select().from(configSchema);
    return JSON.stringify(response);
  });
