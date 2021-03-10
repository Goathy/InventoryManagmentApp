import Boom from '@hapi/boom';
import type Hapi from '@hapi/hapi';
import Bcrypt from 'bcrypt';
import cuid from 'cuid';

import { Enums } from '../../models';
import type { User, UserQuerySchema } from '../../types';
import { isPasswordStrongEnough } from '../auth/auth.functions';
import { SALT } from '../auth/constants';

import { createPaginationObject } from './users.functions';
import {
  createUserPayloadSchema,
  getUserParamSchema,
  getUserQuerySchema,
  getUserResponseSchema,
  getUsersResponseSchema,
  updateMePartialPayloadSchema,
  updateMePayloadSchema,
  updateUserPartialPayloadSchema,
  updateUserPayloadSchema,
} from './users.schema';

export const GetUsersRoute: Hapi.ServerRoute = {
  method: 'GET',
  path: '/users',
  options: {
    auth: { scope: Enums.UserRole.ADMIN },
    validate: { query: getUserQuerySchema },
    response: { schema: getUsersResponseSchema },
  },
  handler: async (request) => {
    const { db } = request.server.app;
    const { id } = request.auth.credentials.session!.user;
    const { take, page } = request.query as UserQuerySchema;

    const [users, count] = await db.$transaction([
      db.user.findMany({
        take,
        skip: take * (page - 1),
        where: { id: { not: id } },
        orderBy: { email: 'asc' },
      }),
      db.user.count({
        where: { id: { not: id } },
        orderBy: { email: 'asc' },
      }),
    ]);

    if (!users.length) {
      return { data: null };
    }

    const pagination = createPaginationObject(request, { take, page, count });

    return {
      data: users,
      page: pagination,
    };
  },
};

export const CreateUserRoute: Hapi.ServerRoute = {
  method: 'POST',
  path: '/users',
  options: {
    auth: { scope: Enums.UserRole.ADMIN },
    validate: { payload: createUserPayloadSchema },
  },
  handler: async (request, h) => {
    const { db } = request.server.app;
    const { password, email, ...rest } = request.payload as User & { readonly password: string };

    const user = await db.user.findUnique({
      where: { email: email },
      rejectOnNotFound: false,
    });

    if (user) {
      throw Boom.conflict();
    }

    if (!isPasswordStrongEnough(password)) {
      throw Boom.badRequest('TOO_EASY');
    }

    const hashedPassword = await Bcrypt.hash(password, SALT);

    await db.user.create({
      data: { ...rest, email, id: cuid(), password: hashedPassword },
    });

    return h.response().code(201);
  },
};

export const UpdateMeRoute: Hapi.ServerRoute = {
  method: 'PUT',
  path: '/users',
  options: {
    validate: {
      payload: updateMePayloadSchema,
    },
    response: { schema: getUserResponseSchema },
  },
  handler: async (request) => {
    const { id } = request.auth.credentials.session!.user;
    const { db } = request.server.app;
    const { password, email, ...rest } = request.payload as User & { readonly password: string };

    if (email) {
      const user = await db.user.findUnique({
        where: { email: email },
        rejectOnNotFound: false,
      });

      if (user) {
        throw Boom.conflict();
      }
    }

    if (!isPasswordStrongEnough(password)) {
      throw Boom.badRequest('TOO_EASY');
    }

    const user = await db.user.update({
      where: { id },
      data: {
        ...rest,
        email,
        ...(password ? { password: await Bcrypt.hash(password, SALT) } : null),
      },
    });

    return { data: user };
  },
};

export const UpdateMePartialRoute: Hapi.ServerRoute = {
  method: 'PATCH',
  path: '/users',
  options: {
    validate: {
      payload: updateMePartialPayloadSchema,
    },
    response: { schema: getUserResponseSchema },
  },
  handler: async (request) => {
    const { id } = request.auth.credentials.session!.user;
    const { db } = request.server.app;
    const { password, email, ...rest } = request.payload as User & { readonly password: string };

    if (email) {
      const user = await db.user.findUnique({
        where: { email: email },
        rejectOnNotFound: false,
      });

      if (user) {
        throw Boom.conflict();
      }
    }

    if (password && !isPasswordStrongEnough(password)) {
      throw Boom.badRequest('TOO_EASY');
    }

    const user = await db.user.update({
      where: { id },
      data: {
        ...rest,
        email,
        ...(password ? { password: await Bcrypt.hash(password, SALT) } : null),
      },
    });

    return { data: user };
  },
};

export const UpdateUserPartialRoute: Hapi.ServerRoute = {
  method: 'PUT',
  path: '/users/{id}',
  options: {
    auth: { scope: Enums.UserRole.ADMIN },
    validate: { params: getUserParamSchema, payload: updateUserPayloadSchema },
    response: { schema: getUserResponseSchema },
  },
  handler: async (request) => {
    const { db } = request.server.app;
    const { id } = request.params as { readonly id: string };
    const { password, email, ...rest } = request.payload as User & { readonly password: string };

    const count = await db.user.count({ where: { id } });

    if (!count) {
      throw Boom.notFound();
    }

    if (email) {
      const user = await db.user.findUnique({
        where: { email: email },
        rejectOnNotFound: false,
      });

      if (user) {
        throw Boom.conflict();
      }
    }

    if (!isPasswordStrongEnough(password)) {
      throw Boom.badRequest('TOO_EASY');
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        ...rest,
        email,
        ...(password ? { password: await Bcrypt.hash(password, SALT) } : null),
      },
    });

    return { data: updatedUser };
  },
};

export const UpdateUserRoute: Hapi.ServerRoute = {
  method: 'PATCH',
  path: '/users/{id}',
  options: {
    auth: { scope: Enums.UserRole.ADMIN },
    validate: { params: getUserParamSchema, payload: updateUserPartialPayloadSchema },
    response: { schema: getUserResponseSchema },
  },
  handler: async (request) => {
    const { db } = request.server.app;
    const { id } = request.params as { readonly id: string };
    const { password, email, ...rest } = request.payload as User & { readonly password: string };

    const count = await db.user.count({ where: { id } });

    if (!count) {
      throw Boom.notFound();
    }

    if (email) {
      const user = await db.user.findUnique({
        where: { email: email },
        rejectOnNotFound: false,
      });

      if (user) {
        throw Boom.conflict();
      }
    }

    if (password && !isPasswordStrongEnough(password)) {
      throw Boom.badRequest('TOO_EASY');
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        ...rest,
        email,
        ...(password ? { password: await Bcrypt.hash(password, SALT) } : null),
      },
    });

    return { data: updatedUser };
  },
};

export const DeleteUserRoute: Hapi.ServerRoute = {
  method: 'DELETE',
  path: '/users/{id}',
  options: { auth: { scope: Enums.UserRole.ADMIN }, validate: { params: getUserParamSchema } },
  handler: async (request) => {
    const { db } = request.server.app;
    const { id } = request.params as { readonly id: string };

    const count = await db.user.count({ where: { id } });

    if (!count) {
      return null;
    }

    await db.$queryRaw`DELETE FROM public."user" WHERE id=${id};`;

    return null;
  },
};
