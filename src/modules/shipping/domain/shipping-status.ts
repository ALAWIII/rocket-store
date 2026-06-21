import { ValueOf } from 'src/shared/types/value-of';

export const ShipmentStatus = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type ShipmentStatus = ValueOf<typeof ShipmentStatus>;
