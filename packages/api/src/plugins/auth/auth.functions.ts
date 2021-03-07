import Zxcvbn from 'zxcvbn';

export function isPasswordStrongEnough(password: string) {
  const result = Zxcvbn(password);
  return result.score >= 3;
}
