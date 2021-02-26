type Nil<T> = T | undefined | null;

type NameToType = {
  readonly NODE_ENV: 'production' | 'development' | 'test';
  readonly PORT: number;
  readonly HOST: string;
};

function getConfigForName<T extends keyof NameToType>(name: T): Nil<NameToType[T]>;
function getConfigForName(name: keyof NameToType): Nil<NameToType[keyof NameToType]> {
  const val = process.env[name];

  switch (name) {
    case 'NODE_ENV':
      return val || 'development';
    case 'PORT':
      return Number.parseInt(val?.trim() || '3000', 10);
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
export const isDevelop = () => getConfig('NODE_ENV') === 'development';
