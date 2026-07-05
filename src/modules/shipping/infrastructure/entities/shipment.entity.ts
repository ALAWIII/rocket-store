import { OrderEntity } from 'src/modules/orders/infrastructure/entities/order.entity';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey } from 'typeorm';
import { OrderAddressEntity } from 'src/modules/users/infrastructure/entities/address.entity';
import { ShipmentMethod } from '../../domain/shipping-method';
import { ShipmentStatus } from '../../domain/shipping-status';
import { ShippingProviderEntity } from './shipping-provider.entity';
import {
  CreateDateColumnTz,
  UpdateDateColumnTz,
} from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';

@Entity('shipments')
export class ShipmentEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(() => OrderEntity, (o) => o.id)
  orderId!: string;
  @Column('uuid', { nullable: true })
  @ForeignKey(() => ShippingProviderEntity, (sp) => sp.id)
  shippingProviderId!: string | null;
  @Column('uuid')
  @ForeignKey(() => OrderAddressEntity, (oa) => oa.id)
  orderAddressId!: string;
  @Column('varchar', { length: 20 })
  shipmentMethod!: ShipmentMethod;
  @Column('varchar', { length: 20 })
  status!: ShipmentStatus;
  @Column('integer')
  shippingFeeInMinorUnit!: number;
  @Column('varchar', { length: 100, nullable: true })
  trackingNumber!: string | null;
  @Column('timestamptz', { nullable: true })
  shippedAt!: Date | null;
  @Column('timestamptz', { nullable: true })
  deliveredAt!: Date | null;
  @CreateDateColumnTz()
  createdAt!: Date;
  @UpdateDateColumnTz()
  updatedAt!: Date;
}
