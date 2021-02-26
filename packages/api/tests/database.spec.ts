import type Hapi from '@hapi/hapi';

import { getServerWithPlugins } from '../src/server';

describe('Server Module', () => {
  let server: Hapi.Server;

  beforeAll(async () => {
    server = await getServerWithPlugins();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('Database Plugin', () => {
    it('Should connect with database', async () => {
      const result = await server.app.db.$queryRaw<
        readonly [{ readonly 'Database ready': boolean }]
      >(`SELECT 1=1 AS "Database ready"`);

      expect(result[0]['Database ready']).toBeTrue();
    });
  });
});
