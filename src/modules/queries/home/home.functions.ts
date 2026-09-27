import { createServerFn } from '@tanstack/react-start';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { getHomeData } from './homeQuery.js';

export const getHomeDataFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async ({ context }) => {
    return getHomeData(context.userId);
  });
