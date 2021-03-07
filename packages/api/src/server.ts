import Hapi from '@hapi/hapi';
import Joi from 'joi';

import { getConfig, isProduction } from './config';
import { AuthPlugin } from './plugins/auth/auth.plugin';
import { DatabasePlugin } from './plugins/database/database.plugin';

const getServer = () => {
  return new Hapi.Server({
    host: getConfig('HOST'),
    port: getConfig('PORT'),
    routes: {
      response: { modify: true, options: { stripUnknown: true, convert: true } },
      validate: {
        options: {
          convert: true,
          stripUnknown: true,
          abortEarly: false,
          errors: { render: false },
        },
      },
    },
  });
};

export const getServerWithPlugins = async () => {
  const server = getServer();

  server.validator(Joi);

  await server.register({ plugin: DatabasePlugin });
  await server.register({
    plugin: AuthPlugin,
    options: {
      isProduction: isProduction(),
      cookiePassword: getConfig('COOKIE_PASSWD'),
      cookieDomain: getConfig('COOKIE_DOMAIN'),
      cookieTtl: getConfig('COOKIE_TTL'),
    },
    routes: { prefix: '/auth' },
  });

  return server;
};
