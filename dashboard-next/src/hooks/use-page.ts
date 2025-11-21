import { parseAsInteger, useQueryState } from 'nuqs';

export function usePage() {
  return useQueryState('page', parseAsInteger.withDefault(1));
}
