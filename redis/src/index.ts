import { RedisClient } from 'bun';

if (!process.env.REDIS_URL)
  throw new Error('REDIS_URL is not defined in environment variables');
const redis = new RedisClient();

export default redis;
