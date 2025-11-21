import { useQueryState } from 'nuqs';

export function useSearch() {
  return useQueryState('search', {
    defaultValue: '',
  });
}
