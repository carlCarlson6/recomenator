import { defineConfig } from 'drizzle-kit';

import { env } from './src/env/server';

export default defineConfig({
  out: './drizzle',
  schema: './src/shared/infrastructure/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL_UNPOOLED,
  },
});
