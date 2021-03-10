import type { Request } from '@hapi/hapi';

import type { Page } from '../../types';

export function createPaginationObject(
  { url: { origin, pathname } }: Request,
  { take, page, count }: { readonly take: number; readonly page: number; readonly count: number }
): Page {
  const lastPage = Math.ceil(count / take);

  return {
    self: {
      number: page,
      href: `${origin}${pathname}?take=${take}&page=${page}`,
    },
    ...(page > 1
      ? { first: { number: 1, href: `${origin}${pathname}?take=${take}&page=${1}` } }
      : null),
    ...(page > 1
      ? {
          prev: {
            number: page - 1,
            href: `${origin}${pathname}?take=${take}&page=${page - 1}`,
          },
        }
      : null),
    ...(lastPage > 1
      ? {
          next: {
            number: page + 1,
            href: `${origin}${pathname}?take=${take}&page=${page + 1}`,
          },
        }
      : null),
    last: {
      number: lastPage,
      href: `${origin}${pathname}?take=${take}&page=${lastPage}`,
    },
  };
}
