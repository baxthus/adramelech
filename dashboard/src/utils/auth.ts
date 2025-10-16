import { auth, currentUser } from '@clerk/nextjs/server';

export async function getUser() {
  const user = await currentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function isAuthenticated() {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) throw new Error('Unauthorized');
}
