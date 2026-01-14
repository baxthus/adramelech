import { type } from 'arktype';

export const NanoID = type('string & /^[A-Za-z0-9_-]{21}$/');
