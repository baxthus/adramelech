'use server';

import { prisma } from 'database';
import z from 'zod';

export async function getProfile(id: string) {
  z.nanoid().parse(id);

  const profile = await prisma.profile.findUnique({
    where: { id },
    include: {
      socials: true,
    },
  });

  if (!profile) throw new Error('Profile not found');

  return profile;
}
