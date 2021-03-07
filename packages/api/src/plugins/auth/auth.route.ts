import Crypto from 'crypto';

import Boom from '@hapi/boom';
import type Hapi from '@hapi/hapi';
import Bcrypt from 'bcrypt';
import cuid from 'cuid';

import type { UserAuth } from '../../types';

import { isPasswordStrongEnough } from './auth.functions';
import { loginSchema, meResponseSchema, registerSchema } from './auth.schema';
import { SALT, SESSION_INCLUDE, SESSION_VALIDITY } from './constants';

export const RegisterRoute: Hapi.ServerRoute = {
  method: 'POST',
  path: '/register',
  options: {
    auth: { mode: 'try' },
    validate: { payload: registerSchema },
  },
  handler: async (request, h) => {
    const { db } = request.server.app;
    const { email, password } = request.payload as UserAuth;

    if (!isPasswordStrongEnough(password)) {
      throw Boom.badRequest('TOO_EASY');
    }

    const user = await db.user.findUnique({ where: { email }, rejectOnNotFound: false });

    if (user) {
      throw Boom.conflict();
    }

    const hashedPassword = await Bcrypt.hash(password, SALT);

    await db.user.create({ data: { id: cuid(), email, password: hashedPassword } });

    return h.response().code(201);
  },
};

export const LoginRoute: Hapi.ServerRoute = {
  method: 'POST',
  path: '/login',
  options: { auth: { mode: 'try' }, validate: { payload: loginSchema } },
  handler: async (request, h) => {
    const { db } = request.server.app;
    const { email, password } = request.payload as UserAuth;

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, isApproved: true },
      rejectOnNotFound: false,
    });

    if (!user) {
      throw Boom.notFound();
    }

    const comparePasswd = await Bcrypt.compare(password, user.password);

    if (!comparePasswd) {
      throw Boom.notFound();
    }

    if (!user?.isApproved) {
      throw Boom.unauthorized("You're not approved");
    }

    const session = await db.session.create({
      data: {
        id: Crypto.randomBytes(32).toString('hex'),
        validUntil: new Date(Date.now() + SESSION_VALIDITY),
        userId: user.id,
      },
      include: SESSION_INCLUDE,
    });

    request.cookieAuth.set(session);

    return h.response().code(200);
  },
};

export const MeRoute: Hapi.ServerRoute = {
  method: 'GET',
  path: '/me',
  options: {
    tags: ['api', 'auth'],
    auth: {
      mode: 'try',
    },
    response: { schema: meResponseSchema },
  },
  handler: (request) => {
    if (request.auth.credentials?.session) {
      return { data: request.auth.credentials.session };
    }

    return { data: null };
  },
};
