import { ResultError } from './result-error';
import { ResultErrors } from './../errors';

export type ResultValidationError = string | string[] | Error;
export type ResultExceptionFactory = (error: ResultValidationError) => unknown;

type ResultValidationSource<T> = {
  readonly instance: T;
  readonly isFailure: boolean;
  readonly errors?: string[];
};

export class ResultValidator<
  T,
  TSource extends ResultValidationSource<T> = ResultValidationSource<T>,
> {
  constructor(private readonly source: TSource) {}

  throwsIfTrue(
    this: ResultValidator<boolean, any>,
    error: ResultValidationError = ResultErrors.EXPRESSION_TRUE,
    exceptionFactory?: ResultExceptionFactory,
  ) {
    if (this.source.instance === true) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  throwsIfFalse(
    this: ResultValidator<boolean, any>,
    error: ResultValidationError = ResultErrors.EXPRESSION_FALSE,
    exceptionFactory?: ResultExceptionFactory,
  ) {
    if (this.source.instance === false) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  throwsIfNull(
    error: ResultValidationError = ResultErrors.INSTANCE_NULL,
    exceptionFactory?: ResultExceptionFactory,
  ): this {
    if (this.source.instance == null) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  throwsIfNotNull(
    error: ResultValidationError = ResultErrors.INSTANCE_NOT_NULL,
    exceptionFactory?: ResultExceptionFactory,
  ): this {
    if (this.source.instance != null) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  throwsIfEmpty(
    error: ResultValidationError = ResultErrors.INSTANCE_EMPTY,
    exceptionFactory?: ResultExceptionFactory,
  ): this {
    if (
      this.source.instance instanceof Array &&
      this.source.instance.length === 0
    ) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  throwsIfNotEmpty(
    error: ResultValidationError = ResultErrors.INSTANCE_NOT_EMPTY,
    exceptionFactory?: ResultExceptionFactory,
  ): this {
    if (
      this.source.instance instanceof Array &&
      this.source.instance.length > 0
    ) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  /**
   * Lança quando a condição sobre a instância é verdadeira.
   * Se a instância for null/undefined, lança RESULT_INSTANCE_NULL: a condição
   * nunca roda sem valor (use throwsIfNull antes para ter um código de domínio).
   */
  throwsIf(
    condition: (instance: NonNullable<TSource['instance']>) => boolean,
    error: ResultValidationError = ResultErrors.EXPRESSION_TRUE,
    exceptionFactory?: ResultExceptionFactory,
  ): this {
    const instance = this.source.instance;

    if (instance == null) {
      this.throwError(ResultErrors.INSTANCE_NULL, exceptionFactory);
    }

    if (condition(instance as NonNullable<TSource['instance']>)) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  /**
   * Lança quando a condição sobre a instância é falsa.
   * Mesma regra de null/undefined que throwsIf.
   */
  throwsIfNot(
    condition: (instance: NonNullable<TSource['instance']>) => boolean,
    error: ResultValidationError = ResultErrors.EXPRESSION_FALSE,
    exceptionFactory?: ResultExceptionFactory,
  ): this {
    return this.throwsIf(
      (instance) => !condition(instance),
      error,
      exceptionFactory,
    );
  }

  throwsIfFailed(
    error: ResultValidationError = this.source.errors ?? ResultErrors.FAILED,
    exceptionFactory?: ResultExceptionFactory,
  ): this {
    if (this.source.isFailure) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  get result(): TSource {
    return this.source;
  }

  private throwError(
    error: ResultValidationError,
    exceptionFactory?: ResultExceptionFactory,
  ): never {
    if (exceptionFactory) {
      throw exceptionFactory(error);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new ResultError(error);
  }
}
