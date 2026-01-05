import { createEnv } from '@t3-oss/env-nextjs';
import { type } from 'arktype';

export const env = createEnv({
  client: {
    NEXT_PUBLIC_REPOSITORY_URL: type('string.url'),
  },

  runtimeEnv: {
    NEXT_PUBLIC_REPOSITORY_URL: process.env.NEXT_PUBLIC_REPOSITORY_URL,
  },
});
