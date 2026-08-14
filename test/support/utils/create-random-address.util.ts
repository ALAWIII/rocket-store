import { customAlphabet } from 'nanoid';
import { createRandomPhoneNumber } from './create-random-phone-number.util';

const nanoidLetters = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  12,
);
export function createRandomAddress() {
  const gen = () => nanoidLetters();
  return {
    fullName: gen(),
    country: gen(),
    city: gen(),
    state: gen(),
    phone: createRandomPhoneNumber(),
    postalCode: gen(),
    addressLine1: gen(),
    addressLine2: gen(),
  };
}
