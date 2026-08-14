import { customAlphabet } from 'nanoid';

const nanoidDigits = customAlphabet('0123456789', 10);

export function createRandomPhoneNumber(): string {
  return `+${nanoidDigits()}`; // e.g. "+7392048156"
}
