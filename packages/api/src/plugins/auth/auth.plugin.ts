// https://github.com/typeofweb/sklep/blob/develop/apps/api/src/plugins/auth/index.ts

import HapiCookie from '@hapi/cookie';
import type Hapi from '@hapi/hapi';

import type { Session, User } from '../../types';

import { LoginRoute, MeRoute, RegisterRoute } from './auth.route';
import { SESSION_INCLUDE } from './constants';

type AuthPluginOptions = {
  readonly cookiePassword: string;
  readonly isProduction: boolean;
  readonly cookieDomain: string;
  readonly cookieTtl: number;
};

declare module '@hapi/hapi' {
  interface AuthCredentials {
    readonly session?: Session & {
      readonly user: User;
    };
  }
}

export const AuthPlugin: Hapi.Plugin<AuthPluginOptions> = {
  name: 'imaAuth',
  multiple: false,
  register: async (server, options) => {
    await server.register(HapiCookie);

    const cookieOptions: HapiCookie.Options = {
      cookie: {
        name: 'session',
        password: options.cookiePassword,
        ttl: options.cookieTtl,
        encoding: 'iron',
        isSecure: options.isProduction,
        isHttpOnly: true,
        clearInvalid: true,
        strictHeader: true,
        isSameSite: 'Lax',
        domain: options.cookieDomain,
        path: '/',
      },
      validateFunc: async (request, session: { readonly id?: string } | undefined) => {
        if (!session?.id || !request) {
          return { valid: false };
        }

        await request.server.app.db.session.deleteMany({
          where: { validUntil: { lt: new Date() } },
        });

        const sessionModel = await request.server.app.db.session.findUnique({
          where: { id: session?.id },
          include: SESSION_INCLUDE,
          rejectOnNotFound: false,
        });

        if (!sessionModel) {
          request.cookieAuth.clear();
          return { valid: false };
        }

        const scope = ['user', `user-${sessionModel.userId}`, sessionModel.user.role];

        return { valid: true, credentials: { session: sessionModel, scope } };
      },
    };

    server.auth.strategy('session', 'cookie', cookieOptions);
    server.auth.default({ strategy: 'session', mode: 'required' });

    server.route([RegisterRoute, LoginRoute, MeRoute]);
  },
};
