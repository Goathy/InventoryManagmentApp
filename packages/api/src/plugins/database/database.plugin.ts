import Boom from '@hapi/boom';
import type Hapi from '@hapi/hapi';
import { PrismaClient } from '@prisma/client';

import { isDevelop, isTesting } from '../../config';

declare module '@hapi/hapi' {
  interface ServerApplicationState {
    readonly db: PrismaClient;
  }
}

export const DatabasePlugin: Hapi.Plugin<never> = {
  name: 'PrismaHapiDatabasePlugin',
  multiple: false,
  register: (server) => {
    // @ts-expect-error
    server.app.db = new PrismaClient({
      ...(isTesting() ? { log: ['error'], errorFormat: 'minimal' } : null),
      ...(isDevelop() ? { log: ['info', 'error', 'warn', 'query'], errorFormat: 'pretty' } : null),
      rejectOnNotFound: { findFirst: () => Boom.notFound(), findUnique: () => Boom.notFound() },
    });

    server.ext({
      type: 'onPreStart',
      method: async (server) => {
        await server.app.db.$connect();
      },
    });

    server.ext({
      type: 'onPostStop',
      method: async (server) => {
        await server.app.db.$disconnect();
      },
    });
  },
};
