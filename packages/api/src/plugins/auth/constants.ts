import { getConfig } from '../../config';

export const SESSION_INCLUDE = {
  user: {
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      avatarURL: true,
      isApproved: true,
      createdAt: true,
      updatedAt: true,
    },
  },
};

export const SESSION_VALIDITY = getConfig('SESSION_VALIDITY');
export const SALT = getConfig('HASH_SALT');
