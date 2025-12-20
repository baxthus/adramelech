type Success<T> = {
  data: T;
  error?: never;
};

type Failure<E> = {
  data?: never;
  error: E;
};

export type Result<T, E = Error> = Success<T> | Failure<E>;

export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> =>
  'data' in result;
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> =>
  'error' in result;

export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (isFailure(result)) throw result.error;
  return result.data;
};
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  if (isFailure(result)) return defaultValue;
  return result.data;
};
export const unwrapOrElse = <T, E>(
  result: Result<T, E>,
  fn: (error: E) => T
): T => {
  if (isFailure(result)) return fn(result.error);
  return result.data;
};

export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> => {
  if (isSuccess(result)) return { data: fn(result.data) };
  return result;
};
export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> => {
  if (isSuccess(result)) return fn(result.data);
  return result;
};
