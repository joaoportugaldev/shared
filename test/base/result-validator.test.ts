import { Result, ResultError, ResultValidator } from '../../src';
import { ResultErrors } from '../../src/errors';

describe('ResultValidator', () => {
  test('should throw in throwsIfTrue when source instance is truthy', () => {
    const validator = new ResultValidator({ instance: true, isFailure: false });

    expect(() => validator.throwsIfTrue('ERR_TRUE')).toThrow('ERR_TRUE');
  });

  test('should not throw in throwsIfTrue when source instance is falsy', () => {
    const validator = new ResultValidator({ instance: false, isFailure: false });

    expect(() => validator.throwsIfTrue()).not.toThrow();
  });

  test('should throw in throwsIfFalse when source instance is falsy', () => {
    const validator = new ResultValidator({ instance: false, isFailure: false });

    expect(() => validator.throwsIfFalse('ERR_FALSE')).toThrow('ERR_FALSE');
  });

  test('should throw in throwsIfNull when source instance is null', () => {
    const validator = new ResultValidator({
      instance: null,
      isFailure: false,
    });

    expect(() => validator.throwsIfNull('ERR_NULL')).toThrow('ERR_NULL');
  });

  test('should throw in throwsIfNotNull when source instance exists', () => {
    const validator = new ResultValidator({
      instance: 'value',
      isFailure: false,
    });

    expect(() => validator.throwsIfNotNull('ERR_NOT_NULL')).toThrow('ERR_NOT_NULL');
  });

  test('should not throw in throwsIfNotNull when source instance is null', () => {
    const validator = new ResultValidator({
      instance: null,
      isFailure: false,
    });

    expect(() => validator.throwsIfNotNull()).not.toThrow();
  });

  test('should throw in throwsIfEmpty for empty arrays', () => {
    const validator = new ResultValidator({ instance: [], isFailure: false });

    expect(() => validator.throwsIfEmpty('ERR_EMPTY')).toThrow('ERR_EMPTY');
  });

  test('should not throw in throwsIfEmpty for non-empty arrays', () => {
    const validator = new ResultValidator({
      instance: ['x'],
      isFailure: false,
    });

    expect(() => validator.throwsIfEmpty()).not.toThrow();
  });

  test('should throw in throwsIfNotEmpty for non-empty arrays', () => {
    const validator = new ResultValidator({
      instance: ['x'],
      isFailure: false,
    });

    expect(() => validator.throwsIfNotEmpty('ERR_NOT_EMPTY')).toThrow('ERR_NOT_EMPTY');
  });

  test('should throw in throwsIfFailed using source errors by default', () => {
    const validator = new ResultValidator({
      instance: undefined,
      isFailure: true,
      errors: ['E1', 'E2'],
    });

    expect(() => validator.throwsIfFailed()).toThrow('E1, E2');
  });

  test('should throw ResultError preserving the original codes', () => {
    const validator = new ResultValidator({
      instance: undefined,
      isFailure: true,
      errors: ['E1', 'E2'],
    });

    try {
      validator.throwsIfFailed();
      throw new Error('SHOULD_HAVE_THROWN');
    } catch (error) {
      expect(error).toBeInstanceOf(ResultError);
      expect((error as ResultError).errors).toEqual(['E1', 'E2']);
    }
  });

  test('should throw the same Error instance when Error is provided', () => {
    const validator = new ResultValidator({ instance: true, isFailure: false });
    const expectedError = new Error('ERR_INSTANCE');

    try {
      validator.throwsIfTrue(expectedError);
      throw new Error('SHOULD_HAVE_THROWN');
    } catch (error) {
      expect(error).toBe(expectedError);
    }
  });

  test('should use custom exception factory when provided', () => {
    const validator = new ResultValidator({ instance: true, isFailure: false });

    expect(() => validator.throwsIfTrue('CHAINED', (error) => new TypeError(String(error)))).toThrow(TypeError);
  });

  test('should return source in fluent get result', () => {
    const result = Result.ok(true);

    const validatedResult = result.validator.throwsIfFalse().result;

    expect(validatedResult).toBe(result);
    expect(validatedResult.isOk).toBe(true);
  });

  test('should not throw when validation conditions are not matched', () => {
    const validator = new ResultValidator({ instance: true, isFailure: false });

    expect(() => validator.throwsIfFalse().throwsIfNull().throwsIfNotEmpty()).not.toThrow();
  });
  describe('throwsIf / throwsIfNot', () => {
    type Entregador = { nome: string; ativo: boolean; pedidosEmRota: string[] };
    const ativo: Entregador = { nome: 'Ana', ativo: true, pedidosEmRota: [] };
    const inativo: Entregador = { nome: 'Leo', ativo: false, pedidosEmRota: ['#4207'] };

    test('throwsIf should throw when the condition is true', () => {
      const result = Result.ok(inativo);

      expect(() => result.validator.throwsIf((e) => !e.ativo, 'ENTREGADOR_INATIVO')).toThrow(
        'ENTREGADOR_INATIVO',
      );
    });

    test('throwsIf should not throw when the condition is false and should return the validator', () => {
      const result = Result.ok(ativo);
      const validator = result.validator;

      expect(validator.throwsIf((e) => e.pedidosEmRota.length > 0, 'COM_PEDIDO')).toBe(validator);
    });

    test('throwsIf should use RESULT_EXPRESSION_TRUE by default', () => {
      const result = Result.ok(inativo);

      expect(() => result.validator.throwsIf((e) => !e.ativo)).toThrow(ResultErrors.EXPRESSION_TRUE);
    });

    test('throwsIfNot should throw when the condition is false', () => {
      const result = Result.ok(inativo);

      expect(() => result.validator.throwsIfNot((e) => e.ativo, 'ENTREGADOR_INATIVO')).toThrow(
        'ENTREGADOR_INATIVO',
      );
    });

    test('throwsIfNot should not throw when the condition is true', () => {
      const result = Result.ok(ativo);

      expect(() => result.validator.throwsIfNot((e) => e.ativo, 'ENTREGADOR_INATIVO')).not.toThrow();
    });

    test('throwsIfNot should use RESULT_EXPRESSION_FALSE by default', () => {
      const result = Result.ok(inativo);

      expect(() => result.validator.throwsIfNot((e) => e.ativo)).toThrow(ResultErrors.EXPRESSION_FALSE);
    });

    test('should throw RESULT_INSTANCE_NULL without running the condition when instance is null', () => {
      const condition = jest.fn(() => false);
      const result = Result.empty<Entregador>();

      expect(() => result.validator.throwsIf(condition, 'X')).toThrow(ResultErrors.INSTANCE_NULL);
      expect(() => result.validator.throwsIfNot(condition, 'X')).toThrow(ResultErrors.INSTANCE_NULL);
      expect(condition).not.toHaveBeenCalled();
    });

    test('should apply the exception factory to the null case and to the condition', () => {
      const factory = (error: unknown) => new TypeError(String(error));

      expect(() => Result.empty<Entregador>().validator.throwsIf(() => true, 'X', factory)).toThrow(
        TypeError,
      );
      expect(() => Result.ok(inativo).validator.throwsIfNot((e) => e.ativo, 'X', factory)).toThrow(
        TypeError,
      );
    });

    test('should throw the given Error instance as is', () => {
      const expected = new Error('CUSTOM');

      expect(() => Result.ok(inativo).validator.throwsIfNot((e) => e.ativo, expected)).toThrow(expected);
    });

    test('should chain with the other guards in a single sentence', () => {
      const buscar = (e: Entregador | null) =>
        Result.ok(e)
          .validator.throwsIfFailed()
          .throwsIfNull('ENTREGADOR_NAO_ENCONTRADO')
          .throwsIfNot((x) => x.ativo, 'ENTREGADOR_INATIVO')
          .throwsIf((x) => x.pedidosEmRota.length > 0, 'ENTREGADOR_COM_PEDIDO_EM_ROTA').result;

      expect(buscar(ativo).instance).toBe(ativo);
      expect(() => buscar(null)).toThrow('ENTREGADOR_NAO_ENCONTRADO');
      expect(() => buscar(inativo)).toThrow('ENTREGADOR_INATIVO');
      expect(() => buscar({ ...inativo, ativo: true })).toThrow('ENTREGADOR_COM_PEDIDO_EM_ROTA');
    });

    test('should become Result.fail when thrown inside Result.tryAsync', async () => {
      const result = await Result.tryAsync(async () => {
        const r = Result.ok(inativo);
        r.validator.throwsIfNull('ENTREGADOR_NAO_ENCONTRADO').throwsIfNot((e) => e.ativo, 'ENTREGADOR_INATIVO');
        return r.instance;
      });

      expect(result.isFailure).toBe(true);
      expect(result.errors).toEqual(['ENTREGADOR_INATIVO']);
    });
  });
});
