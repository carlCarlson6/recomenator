import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  isServer: typeof window === 'undefined',
  server: {
    DATABASE_URL: z.string().url(),
    DATABASE_URL_UNPOOLED: z.string().url(),
    CLERK_SECRET_KEY: z.string().min(1),
  },
  runtimeEnvStrict: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  },
  emptyStringAsUndefined: true,
});
