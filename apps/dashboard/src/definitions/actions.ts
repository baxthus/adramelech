import { type } from 'arktype';

export const DefaultGetActions = type({
  search: 'string?',
  page: 'number.integer > 0 = 1',
});

export const pageSize = 10;
