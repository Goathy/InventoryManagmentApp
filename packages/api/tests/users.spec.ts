import type Hapi from '@hapi/hapi';
import Faker from 'faker';

import { createAndAuthRole, repeatRequest } from '../jest.utils';
import { Enums } from '../src/models';
import { getServerWithPlugins } from '../src/server';
import type { User } from '../src/types';

describe('Users route', () => {
  let server: Hapi.Server;

  beforeAll(async () => {
    server = await getServerWithPlugins();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('[GET] /v1/users', () => {
    it('Should return list of users', async () => {
      const [email, password] = await createAndAuthRole(server, Enums.UserRole.ADMIN);

      await repeatRequest(5, () =>
        createAndAuthRole(
          server,
          Faker.random.arrayElement([Enums.UserRole.USER, Enums.UserRole.ADMIN]),
          Faker.random.arrayElement([true, false])
        )
      );

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const injection = await server.inject({
        method: 'GET',
        url: '/v1/users',
        headers: { Cookie: cookies[0].split(';')[0] },
      });

      const users = await server.app.db.user.findMany({
        where: { email: { not: email } },
        orderBy: { email: 'asc' },
      });

      expect(injection.statusCode).toBe(200);
      expect(injection.result).toHaveProperty(
        'data',
        users.map(({ password, ...rest }) => rest)
      );
    });
    it('Should return 403 if not ADMIN', async () => {
      const [email, password] = await createAndAuthRole(server, Enums.UserRole.USER);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const injection = await server.inject({
        method: 'GET',
        url: '/v1/users',
        headers: { Cookie: cookies[0].split(';')[0] },
      });

      expect(injection.statusCode).toBe(403);
    });
  });
  describe('[DELETE] /v1/users/{id}', () => {
    it('Should delete specific user', async () => {
      const [email, password] = await createAndAuthRole(server, Enums.UserRole.ADMIN);

      await repeatRequest(5, () =>
        createAndAuthRole(
          server,
          Faker.random.arrayElement([Enums.UserRole.USER, Enums.UserRole.ADMIN]),
          Faker.random.arrayElement([true, false])
        )
      );

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const user = await server.app.db.user.findFirst({ where: { email: { not: email } } });

      const injection = await server.inject({
        method: 'DELETE',
        url: `/v1/users/${user!.id}`,
        headers: { Cookie: cookies[0].split(';')[0] },
      });

      const deletedUser = await server.app.db.user.findUnique({
        where: { id: user!.id },
        rejectOnNotFound: false,
      });

      expect(injection.statusCode).toBe(204);
      expect(deletedUser).toBeNull();
    });
  });
  describe('[POST] /v1/users', () => {
    it('Should create new user', async () => {
      const [email, password] = await createAndAuthRole(server, Enums.UserRole.ADMIN);

      const firstName = Faker.name.findName();
      const lastName = Faker.name.lastName();
      const provider = 'ima.com.pl';
      const userEmail = Faker.internet.email(firstName, lastName, provider);
      const userPassword = Faker.internet.password(20, true);

      const payload = {
        avatarURL: Faker.internet.avatar(),
        email: userEmail,
        firstName,
        lastName,
        role: Enums.UserRole.USER,
        isApproved: true,
        password: userPassword,
      };

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const injection = await server.inject({
        method: 'POST',
        url: '/v1/users',
        headers: { Cookie: cookies[0].split(';')[0] },
        payload,
      });

      const createdUser = await server.app.db.user.findUnique({
        where: { email: payload.email },
        rejectOnNotFound: false,
      });

      const { password: newPassword, ...user } = payload;
      const { password: oldPassword, createdAt, updatedAt, id, ...createdUserData } = createdUser!;

      expect(injection.statusCode).toBe(201);
      expect(user).toEqual(createdUserData);
      expect(newPassword).not.toBe(oldPassword);
    });
    it('Should return 400 with message "TOO_EASY" when password is too easy', async () => {
      const [email, password] = await createAndAuthRole(server, Enums.UserRole.ADMIN);

      const firstName = Faker.name.findName();
      const lastName = Faker.name.lastName();
      const provider = 'ima.com.pl';
      const userEmail = Faker.internet.email(firstName, lastName, provider);

      const payload = {
        avatarURL: Faker.internet.avatar(),
        email: userEmail,
        firstName,
        lastName,
        role: Enums.UserRole.USER,
        isApproved: true,
        password: 'simple12345',
      };

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const injection = await server.inject({
        method: 'POST',
        url: '/v1/users',
        headers: { Cookie: cookies[0].split(';')[0] },
        payload,
      });

      expect(injection.statusCode).toBe(400);
      expect(injection.result).toHaveProperty('message', 'TOO_EASY');
    });
    it('Should return 409 if email is  already used', async () => {
      const [email, password] = await createAndAuthRole(server, Enums.UserRole.ADMIN);

      const firstName = Faker.name.findName();
      const lastName = Faker.name.lastName();
      const userPassword = Faker.internet.password(20, true);

      const payload = {
        avatarURL: Faker.internet.avatar(),
        email,
        firstName,
        lastName,
        role: Enums.UserRole.USER,
        isApproved: true,
        password: userPassword,
      };

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const injection = await server.inject({
        method: 'POST',
        url: '/v1/users',
        headers: { Cookie: cookies[0].split(';')[0] },
        payload,
      });

      expect(injection.statusCode).toBe(409);
    });
  });
  describe('[PATCH] /v1/users', () => {
    it('Should update user', async () => {
      const [email, password] = await createAndAuthRole(server);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const firstName = Faker.name.firstName();
      const avatarURL = Faker.internet.avatar();

      const injection = await server.inject({
        method: 'PATCH',
        url: '/v1/users',
        headers: { Cookie: cookies[0].split(';')[0] },
        payload: { firstName, avatarURL },
      });

      const updatedData = await server.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { Cookie: cookies[0].split(';')[0] },
      });

      const { data: updatedUser } = injection.result as { readonly data: User };
      const {
        data: { user: receivedUser },
      } = updatedData.result as { readonly data: { readonly user: User } };

      expect(injection.statusCode).toBe(200);
      expect(updatedUser).toEqual(receivedUser);
    });
    it('Should return 400 with message "TOO_EASY" when password is too easy', async () => {
      const [email, password] = await createAndAuthRole(server);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const injection = await server.inject({
        method: 'PATCH',
        url: '/v1/users',
        headers: { Cookie: cookies[0].split(';')[0] },
        payload: { password: 'simple12345' },
      });

      expect(injection.statusCode).toBe(400);
      expect(injection.result).toHaveProperty('message', 'TOO_EASY');
    });
    it('Should return 409 if email is already used', async () => {
      const [email, password] = await createAndAuthRole(server);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const injection = await server.inject({
        method: 'PATCH',
        url: '/v1/users',
        headers: { Cookie: cookies[0].split(';')[0] },
        payload: { email },
      });

      expect(injection.statusCode).toBe(409);
    });
  });
  describe('[PUT] /v1/users', () => {
    it('Should update user', async () => {
      const [email, password] = await createAndAuthRole(server);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const firstName = Faker.name.firstName();
      const lastName = Faker.name.lastName();
      const provider = 'ima.com.pl';
      const newEmail = Faker.internet.email(firstName, lastName, provider);
      const newPassword = Faker.internet.password(20, true);
      const avatarURL = Faker.internet.avatar();

      const injection = await server.inject({
        method: 'PUT',
        url: '/v1/users',
        headers: { Cookie: cookies[0].split(';')[0] },
        payload: { firstName, lastName, avatarURL, email: newEmail, password: newPassword },
      });

      const updatedData = await server.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { Cookie: cookies[0].split(';')[0] },
      });

      const { data: updatedUser } = injection.result as { readonly data: User };
      const {
        data: { user: receivedUser },
      } = updatedData.result as { readonly data: { readonly user: User } };

      expect(injection.statusCode).toBe(200);
      expect(updatedUser).toEqual(receivedUser);
    });
    it('Should return 400 when partial payload', async () => {
      const [email, password] = await createAndAuthRole(server);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const firstName = Faker.name.firstName();
      const lastName = Faker.name.lastName();
      const provider = 'ima.com.pl';
      const newEmail = Faker.internet.email(firstName, lastName, provider);
      const avatarURL = Faker.internet.avatar();

      const injection = await server.inject({
        method: 'PUT',
        url: '/v1/users',
        headers: { Cookie: cookies[0].split(';')[0] },
        payload: { firstName, lastName, avatarURL, email: newEmail, password: 'simple12345' },
      });

      expect(injection.statusCode).toBe(400);
    });
    it('Should return 400 with message "TOO_EASY" when password is too easy', async () => {
      const [email, password] = await createAndAuthRole(server);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const firstName = Faker.name.firstName();
      const lastName = Faker.name.lastName();
      const provider = 'ima.com.pl';
      const newEmail = Faker.internet.email(firstName, lastName, provider);
      const avatarURL = Faker.internet.avatar();

      const injection = await server.inject({
        method: 'PUT',
        url: '/v1/users',
        headers: { Cookie: cookies[0].split(';')[0] },
        payload: { firstName, lastName, avatarURL, email: newEmail, password: 'simple12345' },
      });

      expect(injection.statusCode).toBe(400);
      expect(injection.result).toHaveProperty('message', 'TOO_EASY');
    });
    it('Should return 409 if email is already used', async () => {
      const [email, password] = await createAndAuthRole(server);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const firstName = Faker.name.firstName();
      const lastName = Faker.name.lastName();
      const newPassword = Faker.internet.password(20, true);
      const avatarURL = Faker.internet.avatar();

      const injection = await server.inject({
        method: 'PUT',
        url: '/v1/users',
        headers: { Cookie: cookies[0].split(';')[0] },
        payload: { email, firstName, lastName, password: newPassword, avatarURL },
      });

      expect(injection.statusCode).toBe(409);
    });
  });
  describe('[PATCH] /v1/users/{id}', () => {
    it('Should update user', async () => {
      const [email, password] = await createAndAuthRole(server, Enums.UserRole.ADMIN);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const user = await server.app.db.user.findFirst({ where: { email: { not: email } } });

      const firstName = Faker.name.firstName();
      const avatarURL = Faker.internet.avatar();

      const injection = await server.inject({
        method: 'PATCH',
        url: `/v1/users/${user!.id}`,
        headers: { Cookie: cookies[0].split(';')[0] },
        payload: { firstName, avatarURL },
      });

      expect(injection.statusCode).toBe(200);
      expect(injection.result).toHaveProperty('data.firstName', firstName);
      expect(injection.result).toHaveProperty('data.avatarURL', avatarURL);
    });
    it('Should return 400 with message "TOO_EASY" when password is too easy', async () => {
      const [email, password] = await createAndAuthRole(server, Enums.UserRole.ADMIN);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const user = await server.app.db.user.findFirst({ where: { email: { not: email } } });

      const injection = await server.inject({
        method: 'PATCH',
        url: `/v1/users/${user!.id}`,
        headers: { Cookie: cookies[0].split(';')[0] },
        payload: { password: 'simple12345' },
      });

      expect(injection.statusCode).toBe(400);
      expect(injection.result).toHaveProperty('message', 'TOO_EASY');
    });
    it('Should return 409 if email is  already used', async () => {
      const [email, password] = await createAndAuthRole(server, Enums.UserRole.ADMIN);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const user = await server.app.db.user.findFirst({ where: { email: { not: email } } });

      const firstName = Faker.name.firstName();
      const avatarURL = Faker.internet.avatar();

      const injection = await server.inject({
        method: 'PATCH',
        url: `/v1/users/${user!.id}`,
        headers: { Cookie: cookies[0].split(';')[0] },
        payload: { firstName, avatarURL, email },
      });

      expect(injection.statusCode).toBe(409);
    });
  });
  describe('[PUT] /v1/users/{id}', () => {
    it('Should update user', async () => {
      const [email, password] = await createAndAuthRole(server, Enums.UserRole.ADMIN);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const user = await server.app.db.user.findFirst({ where: { email: { not: email } } });

      const firstName = Faker.name.firstName();
      const lastName = Faker.name.lastName();
      const provider = 'ima.com.pl';
      const newEmail = Faker.internet.email(firstName, lastName, provider);
      const newPassword = Faker.internet.password(20, true);
      const avatarURL = Faker.internet.avatar();

      const injection = await server.inject({
        method: 'PUT',
        url: `/v1/users/${user!.id}`,
        headers: { Cookie: cookies[0].split(';')[0] },
        payload: {
          firstName,
          lastName,
          email: newEmail,
          password: newPassword,
          avatarURL,
          role: Enums.UserRole.USER,
          isApproved: true,
        },
      });

      expect(injection.statusCode).toBe(200);
      expect(injection.result).toHaveProperty('data.firstName', firstName);
      expect(injection.result).toHaveProperty('data.avatarURL', avatarURL);
    });
    it('Should return 400 when partial payload', async () => {
      const [email, password] = await createAndAuthRole(server, Enums.UserRole.ADMIN);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const user = await server.app.db.user.findFirst({ where: { email: { not: email } } });

      const firstName = Faker.name.firstName();
      const lastName = Faker.name.lastName();
      const provider = 'ima.com.pl';
      const newEmail = Faker.internet.email(firstName, lastName, provider);

      const avatarURL = Faker.internet.avatar();

      const injection = await server.inject({
        method: 'PUT',
        url: `/v1/users/${user!.id}`,
        headers: { Cookie: cookies[0].split(';')[0] },
        payload: {
          firstName,
          lastName,
          email: newEmail,
          avatarURL,
          isApproved: true,
          password: 'simple12345',
        },
      });

      expect(injection.statusCode).toBe(400);
    });
    it('Should return 400 with message "TOO_EASY" when password is too easy', async () => {
      const [email, password] = await createAndAuthRole(server, Enums.UserRole.ADMIN);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const user = await server.app.db.user.findFirst({ where: { email: { not: email } } });

      const firstName = Faker.name.firstName();
      const lastName = Faker.name.lastName();
      const provider = 'ima.com.pl';
      const newEmail = Faker.internet.email(firstName, lastName, provider);

      const avatarURL = Faker.internet.avatar();

      const injection = await server.inject({
        method: 'PUT',
        url: `/v1/users/${user!.id}`,
        headers: { Cookie: cookies[0].split(';')[0] },
        payload: {
          firstName,
          lastName,
          email: newEmail,
          avatarURL,
          role: Enums.UserRole.USER,
          isApproved: true,
          password: 'simple12345',
        },
      });

      expect(injection.statusCode).toBe(400);
      expect(injection.result).toHaveProperty('message', 'TOO_EASY');
    });
    it('Should return 409 if email is  already used', async () => {
      const [email, password] = await createAndAuthRole(server, Enums.UserRole.ADMIN);

      const authInjection = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      const cookies = authInjection.headers['set-cookie'];

      const user = await server.app.db.user.findFirst({ where: { email: { not: email } } });

      const firstName = Faker.name.firstName();
      const lastName = Faker.name.lastName();
      const newPassword = Faker.internet.password(20, true);
      const avatarURL = Faker.internet.avatar();

      const injection = await server.inject({
        method: 'PUT',
        url: `/v1/users/${user!.id}`,
        headers: { Cookie: cookies[0].split(';')[0] },
        payload: {
          firstName,
          lastName,
          role: Enums.UserRole.USER,
          password: newPassword,
          avatarURL,
          email,
          isApproved: true,
        },
      });

      expect(injection.statusCode).toBe(409);
    });
  });
});
