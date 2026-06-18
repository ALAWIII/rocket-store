import { ValueOf } from 'src/shared/types/value-of';

export const PaymentMethod = {
  COD: 'COD',
  ELECTRONIC: 'ELECTRONIC',
} as const;
export type PaymentMethod = ValueOf<typeof PaymentMethod>;
