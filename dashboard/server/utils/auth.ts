// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function protectRoute(auth: any) {
  if (!auth.isAuthenticated)
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
}
