import Joi from 'joi';

import { Enums } from '../../models';
import type { MeSchema, MeSchemaResponse, User, UserAuth } from '../../types';

export const registerSchema = Joi.object<UserAuth>({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const loginSchema = Joi.object<UserAuth>({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const meSchema = Joi.object<MeSchema>({
  id: Joi.string().required(),
  validUntil: Joi.date().required(),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required(),
  user: Joi.object<User>({
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
  }).required(),
});

export const meResponseSchema = Joi.object<MeSchemaResponse>({
  data: meSchema.allow(null),
}).required();
