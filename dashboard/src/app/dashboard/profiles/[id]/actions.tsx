'use server';
import { isAuthenticated } from '@/utils/auth';
import db from 'database';
import { profiles } from 'database/schemas/schema';
import { eq } from 'drizzle-orm';

export async function getProfile(id: string) {
  isAuthenticated();

  const data = await db.query.profiles.findFirst({
    columns: { id: false },
    where: eq(profiles.id, id),
  });
  if (!data) throw new Error('Profile not found');
  return data;
}
