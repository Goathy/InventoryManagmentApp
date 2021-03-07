import type { Models } from '../models';

export type UserAuth = Readonly<Pick<Models['user'], 'email' | 'password'>>;

export type MeSchema = Readonly<
  Omit<Models['session'], 'userId'> & Record<'user', Omit<Models['user'], 'password'>>
>;

export type MeSchemaResponse = { readonly data: MeSchema | null };

export type User = Readonly<Omit<Models['user'], 'password'>>;

export type Session = Readonly<Models['session']>;
