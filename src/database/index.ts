import { drizzle } from 'drizzle-orm/bun-sql';
import env from '#env';
import logger from '~/logger';
import * as schema from './schema';

const db = drizzle(env.DATABASE_URL, { schema });
logger.success('Database connection established');

export default db;
