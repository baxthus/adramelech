import { Elysia, t } from 'elysia';
import { client } from '#bot';

const avatarSizes = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096] as const;
const avatarFormats = ['png', 'jpg', 'webp', 'gif'] as const;

export default new Elysia({
  prefix: 'discord',
  tags: ['Discord'],
  detail: {
    description: 'Discord related endpoints',
  },
}).get(
  '/user',
  async ({ query }) => {
    const user = await client.users.fetch(query.id);

    const avatar = user.displayAvatarURL({
      size: query.avatar?.size || 1024,
      extension: query.avatar?.format || 'webp',
    });

    return {
      username: user.username,
      discriminator:
        user.discriminator === '0' ? undefined : `${user.discriminator}`,
      avatarUrl: avatar,
    };
  },
  {
    query: t.Object({
      id: t.String({
        description: 'Discord user ID',
        minLength: 18,
        maxLength: 19,
        examples: ['505432621086670872'],
      }),
      avatar: t.Optional(
        t.Partial(
          t.Object(
            {
              size: t.Union(
                avatarSizes.map((size) =>
                  t.Literal(size, { title: `${size}px` }),
                ),
                {
                  description: 'Avatar size in pixels',
                  examples: [128],
                  default: 1024,
                },
              ),
              format: t.Union(
                avatarFormats.map((format) =>
                  t.Literal(format, { title: format.toUpperCase() }),
                ),
                {
                  description: 'Avatar image format',
                  examples: ['png'],
                  default: 'webp',
                },
              ),
            },
            {
              description: 'Avatar options',
            },
          ),
        ),
      ),
    }),
    detail: {
      description: 'Get Discord user information',
      responses: {
        200: {
          description: 'User information retrieved successfully',
          content: {
            'application/json': {
              schema: t.Object({
                username: t.String({
                  description: 'Discord username',
                  examples: ['baxthus'],
                }),
                discriminator: t.Optional(
                  t.String({
                    description:
                      'Discord user discriminator (currently only used by bots)',
                    examples: ['4944'],
                    minLength: 4,
                    maxLength: 4,
                  }),
                ),
                avatarUrl: t.String({
                  description: "URL of the user's avatar",
                  examples: [
                    'https://cdn.discordapp.com/avatars/505432621086670872/60c6e72a2b1cdc04f627cdcfe0889ced.webp?size=128',
                  ],
                }),
              }),
            },
          },
        },
        404: {
          description: 'User not found',
          content: {
            'text/plain': {
              schema: t.String({
                description: 'Error message when user is not found',
                examples: ['Unknown User'],
              }),
            },
          },
        },
      },
    },
  },
);
