import { ValueOf } from 'src/modules/shared/types/value-of';

export const ShipmentMethod = {
  STANDARD: 'STANDARD',
  EXPRESS: 'EXPRESS',
} as const;
export type ShipmentMethod = ValueOf<typeof ShipmentMethod>;
