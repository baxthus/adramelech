'use server';

import db from 'database';
import { profiles } from 'database/schemas/schema';
import { eq } from 'drizzle-orm';
import z from 'zod';

export async function getProfile(id: string) {
  z.uuid().parse(id);

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, id),
    with: {
      feedbacks: true,
      socials: true,
    },
  });

  if (!profile) throw new Error('Profile not found');

  return profile;
}
