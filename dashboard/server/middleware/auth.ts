import { clerkMiddleware } from '@clerk/nuxt/server';

export default clerkMiddleware(async (event) => {
  const { isAuthenticated } = event.context.auth();

  const isProtected = event.path.startsWith('/api');
  if (isProtected && !isAuthenticated)
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
});
