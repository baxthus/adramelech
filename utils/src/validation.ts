import { type, type Type } from 'arktype';
import { err, ok, type Result } from 'neverthrow';

export const arkToResult =
  <T extends Type>(schema: T) =>
  (value: unknown): Result<T['infer'], type.errors['summary']> => {
    const out = schema(value);
    if (out instanceof type.errors) return err(out.summary);
    return ok(out);
  };
