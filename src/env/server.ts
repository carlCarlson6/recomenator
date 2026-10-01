import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  isServer: typeof window === 'undefined',
  server: {
    DATABASE_URL: z.string().url(),
    DATABASE_URL_UNPOOLED: z.string().url(),
    CLERK_SECRET_KEY: z.string().min(1),
    AWS_ENDPOINT_URL_S3: z.string().url(),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    AWS_REGION: z.string().min(1),
    S3_AVATAR_BUCKET: z.string().min(1),
  },
  runtimeEnvStrict: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    AWS_ENDPOINT_URL_S3: process.env.AWS_ENDPOINT_URL_S3,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    S3_AVATAR_BUCKET: process.env.S3_AVATAR_BUCKET,
  },
  emptyStringAsUndefined: true,
});
