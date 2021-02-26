import Hapi from '@hapi/hapi';

import { getConfig } from './config';
import { DatabasePlugin } from './plugins/database/database.plugin';

const getServer = () => {
  return new Hapi.Server({
    host: getConfig('HOST'),
    port: getConfig('PORT'),
  });
};

export const getServerWithPlugins = async () => {
  const server = getServer();

  await server.register({ plugin: DatabasePlugin });

  server.route({
    method: 'GET',
    path: '/',
    handler: () => {
      return 'Be Happy 😊';
    },
  });

  return server;
};
