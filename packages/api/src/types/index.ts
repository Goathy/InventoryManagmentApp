import type { Models } from '../models';

export type UserAuth = Readonly<Pick<Models['user'], 'email' | 'password'>>;

export type MeSchema = Readonly<
  Omit<Models['session'], 'userId'> & Record<'user', Omit<Models['user'], 'password'>>
>;

export type UserQuerySchema = {
  readonly take: number;
  readonly page: number;
};

export type UserResponseSchema = {
  readonly data: User;
};
export type Link = { readonly number: number; readonly href: string };

export type Page = {
  readonly first?: Link;
  readonly self: Link;
  readonly prev?: Link;
  readonly next?: Link;
  readonly last: Link;
};

export type UsersResponseSchema = {
  readonly data: readonly User[];
  readonly page: Page;
};

export type UserParamSchema = {
  readonly id: Pick<User, 'id'>;
};

export type UserPayloadSchema = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
  readonly password: string;
};

export type MePayloadSchema = Omit<UserPayloadSchema, 'role' | 'isApproved'>;

export type MeSchemaResponse = { readonly data: MeSchema | null };

export type User = Readonly<Omit<Models['user'], 'password'>>;

export type Session = Readonly<Models['session']>;
