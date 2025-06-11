import Elysia, { status, t } from 'elysia';
import db from '#db';
import { eq, sql } from 'drizzle-orm';
import { phrases } from '#db/schema';

export default new Elysia({
  prefix: 'phrases',
  tags: ['commands'],
})
  .get(
    '/',
    async ({ query }) => {
      if (query.random) {
        const phrase = await db.query.phrases.findFirst({
          orderBy: sql`RANDOM()`,
        });
        if (!phrase) return status(404, 'No phrases found');
        return [phrase];
      }

      const phrases = await db.query.phrases.findMany();
      if (phrases.length === 0) return status(404, 'No phrases found');
      return phrases;
    },
    {
      query: t.Partial(
        t.Object({
          random: t.Boolean({
            description: 'Whether to return a random phrase',
            example: true,
          }),
        })
      ),
      detail: {
        description: 'Get a list of phrases or a random phrase',
        responses: {
          200: {
            description: 'List of phrases',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  minItems: 1,
                  description: 'Will only return one item if `random` is true',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer', example: 1 },
                      content: {
                        type: 'string',
                        example: 'I wish I were Heather',
                      },
                      source: {
                        type: 'string',
                        example: 'Heather, Conan Gray',
                      },
                      created_at: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-06-11T18:22:16.000Z',
                      },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: 'No phrases found',
            content: {
              'plain/text': {
                schema: {
                  type: 'string',
                  example: 'No phrases found',
                },
              },
            },
          },
        },
      },
    }
  )
  .post(
    '/',
    async ({ body }) => {
      const phrase = await db.insert(phrases).values(body).returning();
      if (phrase.length === 0) return status(500, 'Failed to create phrase');
      return status(201, phrase[0]);
    },
    {
      body: t.Object({
        content: t.String({
          description: 'The content of the phrase',
          example: 'I wish I were Heather',
        }),
        source: t.String({
          description: 'The source of the phrase (e.g., song, book)',
          example: 'Heather, Conan Gray',
        }),
      }),
      detail: {
        description: 'Create a new phrase',
        responses: {
          201: {
            description: 'The created phrase',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer', example: 1 },
                    content: {
                      type: 'string',
                      example: 'I wish I were Heather',
                    },
                    source: { type: 'string', example: 'Heather, Conan Gray' },
                    created_at: {
                      type: 'string',
                      format: 'date-time',
                      example: '2025-06-11T18:22:16.000Z',
                    },
                  },
                },
              },
            },
          },
          500: {
            description: 'Failed to create phrase',
            content: {
              'plain/text': {
                schema: {
                  type: 'string',
                  example: 'Failed to create phrase',
                },
              },
            },
          },
        },
      },
    }
  )
  .delete(
    '/',
    async ({ query }) => {
      const result = await db
        .delete(phrases)
        .where(eq(phrases.id, query.id))
        .returning();
      if (result.length === 0) return status(404, 'Phrase not found');

      return status(204);
    },
    {
      query: t.Object({
        id: t.Integer({
          description: 'The ID of the phrase to delete',
          example: 1,
          minimum: 1,
        }),
      }),
      detail: {
        description: 'Delete a phrase by ID',
        responses: {
          204: {
            description: 'Phrase deleted successfully',
          },
          404: {
            description: 'Phrase not found',
            content: {
              'plain/text': {
                schema: {
                  type: 'string',
                  example: 'Phrase not found',
                },
              },
            },
          },
        },
      },
    }
  );
