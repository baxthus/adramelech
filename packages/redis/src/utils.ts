import redis from '.';
import { Result } from 'better-result';

export async function testConnection(): Promise<Result<number, string>> {
  const start = performance.now();
  const result = await Result.tryPromise(() => redis.ping());
  return result
    .map(() => performance.now() - start)
    .mapError(() => 'Failed to connect to Redis');
}
