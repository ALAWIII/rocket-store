import { ValueOf } from 'src/shared/types/value-of';

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;
export type PaymentStatus = ValueOf<typeof PaymentStatus>;
