export class ExpectedError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.name = 'ExpectedError';
    if (options?.cause) this.cause = options.cause;
  }
}
