import type Hapi from '@hapi/hapi';
import Faker from 'faker';

import { createAndAuthRole } from '../jest.utils';
import { getServerWithPlugins } from '../src/server';

describe('Auth Plugin', () => {
  let server: Hapi.Server;

  beforeAll(async () => {
    server = await getServerWithPlugins();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('[POST] /auth/register', () => {
    it('Should create user account', async () => {
      const firstName = Faker.name.findName();
      const lastName = Faker.name.lastName();
      const provider = 'ima.com.pl';
      const email = Faker.internet.email(firstName, lastName, provider);
      const password = Faker.internet.password(20, true);

      const injection = await server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email, password },
      });

      expect(injection.statusCode).toBe(201);
    });

    it('Should return 409 in account alredy exist', async () => {
      const firstName = Faker.name.findName();
      const lastName = Faker.name.lastName();
      const provider = 'ima.com.pl';
      const email = Faker.internet.email(firstName, lastName, provider);
      const password = Faker.internet.password(20, true);

      await server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email, password },
      });

      const injection = await server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email, password },
      });

      expect(injection.statusCode).toBe(409);
    });

    it('Should return 400 with message "TOO_EASY" when password is too easy', async () => {
      const firstName = Faker.name.findName();
      const lastName = Faker.name.lastName();
      const provider = 'ima.com.pl';
      const email = Faker.internet.email(firstName, lastName, provider);

      const injection = await server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email, password: 'P@ssWord1' },
      });

      expect(injection.statusCode).toBe(400);
      expect(injection.result).toHaveProperty('message', 'TOO_EASY');
    });
  });
  describe('[POST] /auth/login', () => {
    it('Should login user', async () => {
      const [email, password] = await createAndAuthRole(server);

      const injection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      expect(injection.statusCode).toBe(200);
      expect(injection.headers['set-cookie'][0].startsWith('session')).toBeTrue();
    });

    it('Should return 401  with message "You\'re not approved" if user are not approved', async () => {
      const firstName = Faker.name.findName();
      const lastName = Faker.name.lastName();
      const provider = 'ima.com.pl';
      const email = Faker.internet.email(firstName, lastName, provider);
      const password = Faker.internet.password(20, true);

      await server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email,
          password,
        },
      });

      const injection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email,
          password,
        },
      });

      expect(injection.statusCode).toBe(401);
      expect(injection.result).toHaveProperty('message', "You're not approved");
    });

    it('Should return 404 if user not exist', async () => {
      const firstName = Faker.name.findName();
      const lastName = Faker.name.lastName();
      const provider = 'ima.com.pl';
      const email = Faker.internet.email(firstName, lastName, provider);
      const password = Faker.internet.password(20, true);

      const injection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email,
          password,
        },
      });

      expect(injection.statusCode).toBe(404);
    });

    it('Should return 404 if user provide wrong password', async () => {
      const firstName = Faker.name.findName();
      const lastName = Faker.name.lastName();
      const provider = 'ima.com.pl';
      const email = Faker.internet.email(firstName, lastName, provider);
      const password = Faker.internet.password(20, true);

      await server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email,
          password,
        },
      });

      const injection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email,
          password: '@password!',
        },
      });

      expect(injection.statusCode).toBe(404);
    });
  });

  describe('Protected routes', () => {
    it('Logged user should have acces to protected route', async () => {
      server.route({
        method: 'GET',
        path: '/protected',
        options: { auth: { mode: 'required' } },
        handler: (request) => {
          return request.auth.credentials.session;
        },
      });

      const failedInjection = await server.inject({
        method: 'GET',
        url: '/protected',
      });

      expect(failedInjection.statusCode).toBe(401);

      const [email, password] = await createAndAuthRole(server);

      const injection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email,
          password,
        },
      });

      const cookies = injection.headers['set-cookie'];

      const authorizedInjection = await server.inject({
        method: 'GET',
        url: '/protected',
        headers: { Cookie: cookies[0].split(';')[0] },
      });

      expect(authorizedInjection.statusCode).toBe(200);
      expect(authorizedInjection.result).toHaveProperty('id');
      expect(authorizedInjection.result).toHaveProperty('user');
      expect(authorizedInjection.result).toHaveProperty('user.email', email);
    });
  });
  describe('[GET] /me', () => {
    it('Should return null if user are not logged in', async () => {
      const injection = await server.inject({ method: 'GET', url: '/auth/me' });

      expect(injection.result).toHaveProperty('data', null);
    });

    it('Should return user information', async () => {
      const [email, password] = await createAndAuthRole(server);

      const injection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = injection.headers['set-cookie'];

      const authorizedInjection = await server.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { Cookie: cookies[0].split(';')[0] },
      });

      expect(authorizedInjection.result).toHaveProperty('data.user.email', email);
    });
  });
});
