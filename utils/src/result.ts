export class Result<T, E = Error> {
  private readonly _data?: T;
  private readonly _error?: E;

  private constructor(data?: T, error?: E) {
    this._data = data;
    this._error = error;
  }

  static success<T, E = Error>(data: T): Result<T, E> {
    return new Result<T, E>(data, undefined);
  }

  // Exclude undefined from error to ensure that failure always has an error
  static failure<T, E = Error>(error: Exclude<E, undefined>): Result<T, E> {
    return new Result<T, E>(undefined, error);
  }

  isSuccess(): this is Result<T, never> {
    return this._error === undefined;
  }

  isFailure(): this is Result<never, E> {
    return this._error !== undefined;
  }

  get data(): T {
    if (this.isFailure()) throw new Error('Cannot access data on a failure');
    return this._data as T;
  }

  get error(): E {
    if (this.isSuccess()) throw new Error('Cannot access error on a success');
    return this._error as E;
  }

  unwrap(): T {
    if (this.isFailure())
      throw this._error instanceof Error
        ? this._error
        : new Error(String(this._error));
    return this._data as T;
  }

  unwrapOr(defaultValue: T): T {
    if (this.isFailure()) return defaultValue;
    return this._data as T;
  }

  unwrapOrElse(fn: (error: E) => T): T {
    if (this.isFailure()) return fn(this._error as E);
    return this._data as T;
  }

  map<U>(fn: (data: T) => U): Result<U, E> {
    if (this.isSuccess()) return Result.success(fn(this._data as T));
    return Result.failure(this._error as Exclude<E, undefined>);
  }

  flatMap<U>(fn: (data: T) => Result<U, E>): Result<U, E> {
    if (this.isSuccess()) return fn(this._data as T);
    return Result.failure(this._error as Exclude<E, undefined>);
  }
}
