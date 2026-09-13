import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

export function createId(prefix: string): string {
  const generate = customAlphabet(alphabet, 16);
  return `${prefix}_${generate()}`;
}
