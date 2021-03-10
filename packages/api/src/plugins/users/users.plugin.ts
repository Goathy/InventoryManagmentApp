import type Hapi from '@hapi/hapi';

import {
  CreateUserRoute,
  DeleteUserRoute,
  GetUsersRoute,
  UpdateMePartialRoute,
  UpdateMeRoute,
  UpdateUserPartialRoute,
  UpdateUserRoute,
} from '../users/users.routes';
export const UsersPlugin: Hapi.Plugin<never> = {
  name: 'imaUsers',
  multiple: false,
  register: (server) => {
    server.route([
      GetUsersRoute,
      CreateUserRoute,
      UpdateMePartialRoute,
      UpdateMeRoute,
      UpdateUserPartialRoute,
      UpdateUserRoute,
      DeleteUserRoute,
    ]);
  },
};
