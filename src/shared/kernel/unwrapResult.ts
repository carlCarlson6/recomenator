import type { DomainError } from './DomainError.js';
import type { Result } from './Result.js';

export function unwrapResult<T>(result: Result<T, DomainError>): T {
  if (!result.ok) throw result.error;
  return result.value;
}
