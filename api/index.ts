import swagger from '@elysiajs/swagger';
import Elysia from 'elysia';
import path from 'path';
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
    })
  )
  .onRequest(({ set }) => {
    // Nuke cache headers
    set.headers['Cache-Control'] =
      'no-store, no-cache, must-revalidate, proxy-revalidate';
    set.headers['Expires'] = '0';
    set.headers['Pragma'] = 'no-cache';
  })
  .get('/', ({ redirect }) => redirect('/docs'), {
    detail: {
      description: 'Redirects to the API documentation',
      tags: ['root'],
    },
  });

const files = await findRecursively(path.join(__dirname, 'routes'));
const routes = await Promise.all(
  files.map(async (file) => {
    const module = await import(file);
    return module.default;
  })
);

routes.forEach((route) => app.use(route));

export default app;
