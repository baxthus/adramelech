import { auth } from '@clerk/nextjs/server';

export async function protect(): Promise<{ userId: string }> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) throw new Error('Unauthorized');
  return { userId: userId! };
}
