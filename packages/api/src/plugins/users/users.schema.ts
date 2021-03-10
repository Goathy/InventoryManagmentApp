import Joi from 'joi';

import { Enums } from '../../models';
import type {
  Link,
  MePayloadSchema,
  Page,
  User,
  UserParamSchema,
  UserPayloadSchema,
  UserQuerySchema,
  UserResponseSchema,
  UsersResponseSchema,
} from '../../types';

const userSchema = Joi.object<User>({
  id: Joi.string().required(),
  email: Joi.string().email().required(),
  role: Joi.string()
    .valid(...Object.keys(Enums.UserRole))
    .required(),
  firstName: Joi.string().allow(null),
  lastName: Joi.string().allow(null),
  avatarURL: Joi.string().uri().allow(null),
  isApproved: Joi.boolean().required(),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required(),
});

export const getUserQuerySchema = Joi.object<UserQuerySchema>({
  take: Joi.number().integer().min(25).max(500).default(25),
  page: Joi.number().integer().min(1).default(1),
});

export const getUserResponseSchema = Joi.object<UserResponseSchema>({
  data: userSchema.required().allow(null),
}).required();

export const getUsersResponseSchema = Joi.object<UsersResponseSchema>({
  data: Joi.array().items(userSchema).required().allow(null),
  page: Joi.object<Page>({
    self: Joi.object<Link>({ number: Joi.number().integer(), href: Joi.string() }),
    first: Joi.object<Link>({ number: Joi.number().integer(), href: Joi.string() }),
    prev: Joi.object<Link>({ number: Joi.number().integer(), href: Joi.string() }),
    next: Joi.object<Link>({ number: Joi.number().integer(), href: Joi.string() }),
    last: Joi.object<Link>({ number: Joi.number().integer(), href: Joi.string() }),
  }).required(),
}).required();

export const getUserParamSchema = Joi.object<UserParamSchema>({
  id: Joi.string().required(),
}).required();

export const createUserPayloadSchema = Joi.object<UserPayloadSchema>({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string()
    .valid(...Object.keys(Enums.UserRole))
    .required(),
  firstName: Joi.string().allow(null),
  lastName: Joi.string().allow(null),
  avatarURL: Joi.string().uri().allow(null),
  isApproved: Joi.boolean(),
}).required();

export const updateUserPartialPayloadSchema = Joi.object<UserPayloadSchema>({
  email: Joi.string().email(),
  password: Joi.string(),
  role: Joi.string().valid(...Object.keys(Enums.UserRole)),
  firstName: Joi.string().allow(null),
  lastName: Joi.string().allow(null),
  avatarURL: Joi.string().uri().allow(null),
  isApproved: Joi.boolean(),
}).required();

export const updateUserPayloadSchema = Joi.object<UserPayloadSchema>({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string()
    .valid(...Object.keys(Enums.UserRole))
    .required(),
  firstName: Joi.string().allow(null).required(),
  lastName: Joi.string().allow(null).required(),
  avatarURL: Joi.string().uri().allow(null).required(),
  isApproved: Joi.boolean().required(),
}).required();

export const updateMePayloadSchema = Joi.object<MePayloadSchema>({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  firstName: Joi.string().allow(null).required(),
  lastName: Joi.string().allow(null).required(),
  avatarURL: Joi.string().uri().allow(null).required(),
}).required();

export const updateMePartialPayloadSchema = Joi.object<MePayloadSchema>({
  email: Joi.string().email(),
  password: Joi.string(),
  firstName: Joi.string().allow(null),
  lastName: Joi.string().allow(null),
  avatarURL: Joi.string().uri().allow(null),
}).required();
