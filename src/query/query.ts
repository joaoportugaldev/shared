import { Result } from '../base/result';

/**
 * Contrato padrão de uma consulta (lado de leitura do CQRS).
 * Cada consulta é uma interface própria com uma única operação `execute`.
 */
export interface Query<IN, OUT> {
  execute(input: IN): Promise<Result<OUT>>;
}
