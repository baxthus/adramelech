import { fromAsyncThrowable, type ResultAsync } from 'neverthrow';
import redis from '.';

export function testConnection(): ResultAsync<number, string> {
  const start = performance.now();
  return fromAsyncThrowable(
    () => redis.ping(),
    () => 'Failed to connect to Redis'
  )().map(() => performance.now() - start);
}
