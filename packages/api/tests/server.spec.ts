import type Hapi from '@hapi/hapi';

import { getServerWithPlugins } from '../src/server';

describe('Server Module', () => {
  let server: Hapi.Server;

  beforeAll(() => {
    server = getServerWithPlugins();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('[GET] /', () => {
    it('Should Be Happy 😊', async () => {
      const injection = await server.inject({ method: 'GET', url: '/' });

      expect(injection.result).toBe('Be Happy 😊');
    });
  });
});
