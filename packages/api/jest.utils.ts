import type { Server } from '@hapi/hapi';
import Faker from 'faker';

import { Enums } from './src/models';

export async function createAndAuthRole(
  server: Server,
  role: keyof Enums['UserRole'] = Enums.UserRole.USER,
  isApproved: boolean = true
) {
  const firstName = Faker.name.findName();
  const lastName = Faker.name.lastName();
  const provider = 'ima.com.pl';
  const email = Faker.internet.email(firstName, lastName, provider);
  const password = Faker.internet.password(20, true);

  await server.inject({ method: 'POST', url: '/auth/register', payload: { email, password } });

  await server.app.db.user.update({ where: { email }, data: { isApproved, role } });

  return [email, password];
}
