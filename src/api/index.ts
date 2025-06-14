import swagger from '@elysiajs/swagger';
import Elysia from 'elysia';
import path from 'path';
import { client } from '~/bot';
import env from '~/env';
import logger from '~/logger';
import findRecursively from '~/utils/findRecursively';

const app = new Elysia()
  .use(
    swagger({
      path: '/docs',
      scalarConfig: {
        theme: 'deepSpace',
        customCss: '', // Disabled Elysia default styles
      },
      documentation: {
        info: {
          title: 'Adramelech Bot API',
          version: 'rolling-release',
          description: 'Recommended pulling rate of 1 request per 5 seconds',
        },
      },
    }),
  )
  .onRequest(({ set }) => {
    // Nuke cache headers
    set.headers['Cache-Control'] =
      'no-store, no-cache, must-revalidate, proxy-revalidate';
    set.headers['Expires'] = '0';
    set.headers['Pragma'] = 'no-cache';
  })
  .get('/', () => 'OK', {
    detail: {
      description: 'Check if the API is running',
      responses: {
        200: {
          description: 'API is running',
          content: {
            'text/plain': {
              schema: {
                type: 'string',
                example: 'OK',
              },
            },
          },
        },
      },
    },
  });

const files = await findRecursively(path.join(__dirname, 'routes'));
const routes = await Promise.all(
  files.map(async (file) => {
    const module = await import(file);
    return module.default;
  }),
);

routes.forEach((route) => app.use(route));

app.listen(env.API_PORT, (server) => {
  logger.info(
    `🦊 Elysia is running at http://${server.hostname}:${server.port}`,
  );

  setInterval(() => {
    const data = {
      type: 'data',
      latency: client.ws.ping,
    };
    server.publish('latency', JSON.stringify(data));
  }, 5000);
});
