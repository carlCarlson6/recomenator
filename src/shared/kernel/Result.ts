import { DomainError } from './DomainError.js';

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E extends DomainError> = { readonly ok: false; readonly error: E };
export type Result<T, E extends DomainError = DomainError> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E extends DomainError>(error: E): Err<E> => ({ ok: false, error });
