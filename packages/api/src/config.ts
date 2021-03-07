// https://github.com/typeofweb/sklep/blob/develop/apps/api/src/config.ts

import ms from 'ms';

type Nil<T> = T | undefined | null;

type NameToType = {
  readonly NODE_ENV: 'production' | 'development' | 'test';
  readonly PORT: number;
  readonly HOST: string;
  readonly HASH_SALT: number;
  readonly SESSION_VALIDITY: number;
  readonly COOKIE_TTL: number;
  readonly COOKIE_DOMAIN: string;
  readonly COOKIE_PASSWD: string;
};

function getConfigForName<T extends keyof NameToType>(name: T): Nil<NameToType[T]>;
function getConfigForName(name: keyof NameToType): Nil<NameToType[keyof NameToType]> {
  const val = process.env[name];

  switch (name) {
    case 'NODE_ENV':
      return val || 'development';
    case 'PORT':
      return Number.parseInt(val?.trim() || '3000', 10);
    case 'HASH_SALT':
      return Number.parseInt(val?.trim() || '10', 10);
    case 'SESSION_VALIDITY':
      return ms(val || '1 day');
    case 'COOKIE_TTL':
      return ms(val || '1 day');
  }
  return val;
}

export function getConfig<T extends keyof NameToType>(name: T): NameToType[T];
export function getConfig(name: keyof NameToType): NameToType[keyof NameToType] {
  const val = getConfigForName(name);

  if (!val) {
    throw new Error(`Cannot find environmental variable: ${name}`);
  }

  return val;
}

export const isTesting = () => getConfig('NODE_ENV') === 'test';
export const isDevelopment = () => getConfig('NODE_ENV') === 'development';
export const isProduction = () => getConfig('NODE_ENV') === 'production';
