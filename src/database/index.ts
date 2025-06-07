import { drizzle } from 'drizzle-orm/libsql';
import env from '#env';
import logger from '~/logger';

const db = drizzle(env.DB_FILE_NAME);
logger.success('Database connection established');

export default db;
