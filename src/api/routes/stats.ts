import Elysia, { status } from 'elysia';
import { client } from '#bot';

export default new Elysia({ prefix: 'telemetry', tags: ['telemetry'] }).get(
  '/latency',
  () => {
    const latency = client.ws.ping;
    if (latency === -1) return status(502, 'Latency not available');
    return { latency };
  },
  {
    detail: {
      description: 'Get the current latency of the bot',
      responses: {
        200: {
          description: 'Latency in milliseconds',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  latency: {
                    type: 'number',
                    example: 123,
                  },
                },
              },
            },
          },
        },
        502: {
          description: 'Latency not available',
          content: {
            'plain/text': {
              schema: {
                type: 'string',
                example: 'Latency not available',
              },
            },
          },
        },
      },
    },
  }
);
