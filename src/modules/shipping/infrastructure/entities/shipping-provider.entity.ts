import {
  CreateDateColumnTz,
  UpdateDateColumnTz,
} from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity } from 'typeorm';

@Entity('shipping_providers')
export class ShippingProviderEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('varchar', { length: 50, unique: true })
  slug!: string;
  @Column('varchar', { length: 50 })
  displayName!: string;
  @Column('boolean', { default: true })
  isActive!: boolean;
  @Column('jsonb')
  config!: Record<string, unknown>;
  @CreateDateColumnTz()
  createdAt!: Date;
  @UpdateDateColumnTz()
  updatedAt!: Date;
}
