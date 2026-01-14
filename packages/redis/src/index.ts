import { RedisClient } from 'bun';

if (!process.env.REDIS_URL)
  throw new Error('REDIS_URL is not defined in environment variables');
const redis = new RedisClient();

export const telemetryRedis = new RedisClient(process.env.ANALYTICS_REDIS_URL, {
  maxRetries: 0,
});

export default redis;
export { telemetryRedis as tlmRedis };
