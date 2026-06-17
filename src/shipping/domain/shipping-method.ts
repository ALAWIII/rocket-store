export const ShipmentMethod = {
  STANDARD: 'STANDARD',
  EXPRESS: 'EXPRESS',
} as const;
export type ShipmentMethod =
  (typeof ShipmentMethod)[keyof typeof ShipmentMethod];
