export const ShipmentStatus = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type ShipmentStatus =
  (typeof ShipmentStatus)[keyof typeof ShipmentStatus];
