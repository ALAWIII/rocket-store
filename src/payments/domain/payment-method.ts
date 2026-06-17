export const PaymentMethod = {
  COD: 'COD',
  ELECTRONIC: 'ELECTRONIC',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
