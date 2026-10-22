import { falha } from './falha';
import { Result } from './result';
import { ValueObject } from './value-object';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class Id extends ValueObject<string> {
  static novo(): Id {
    return new Id(crypto.randomUUID());
  }

  static criar(bruto: unknown, campo = 'id'): Result<Id> {
    if (typeof bruto !== 'string' || !UUID.test(bruto)) return Result.fail(falha('ID_INVALIDO', 'validacao', { campo }));
    return Result.ok(new Id(bruto.toLowerCase()));
  }
}
