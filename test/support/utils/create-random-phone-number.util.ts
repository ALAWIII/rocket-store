import { customAlphabet } from 'nanoid';

const digits = customAlphabet('0123456789', 14);
const nonZeroDigit = customAlphabet('123456789', 1);

export function createRandomPhoneNumber(): string {
  return `+${nonZeroDigit()}${digits()}`;
}
