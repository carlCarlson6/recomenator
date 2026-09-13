import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  isServer: typeof window === 'undefined',
  clientPrefix: 'VITE_',
  client: {
    VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    VITE_CLERK_SIGN_IN_URL: z.string().min(1),
    VITE_CLERK_SIGN_UP_URL: z.string().min(1),
    VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.string().min(1),
    VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z.string().min(1),
  },
  runtimeEnv: import.meta.env as Record<string, string | undefined>,
  emptyStringAsUndefined: true,
});
