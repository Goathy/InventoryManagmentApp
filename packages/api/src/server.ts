import Hapi from '@hapi/hapi';

import { getConfig } from './config';

const getServer = () => {
  return new Hapi.Server({
    host: getConfig('HOST'),
    port: getConfig('PORT'),
  });
};

export const getServerWithPlugins = () => {
  const server = getServer();

  server.route({
    method: 'GET',
    path: '/',
    handler: () => {
      return 'Be Happy 😊';
    },
  });

  return server;
};
