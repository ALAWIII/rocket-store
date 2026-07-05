import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey, Unique } from 'typeorm';
import { UserEntity } from './user.entity';
import { AddressType } from '../../domain/address';
import { OrderEntity } from 'src/modules/orders/infrastructure/entities/order.entity';
import {
  CreateDateColumnTz,
  DeleteDateColumnTz,
  UpdateDateColumnTz,
} from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';

@Entity('addresses')
export class AddressEntity {
  @UuidV7PrimaryColumn()
  id!: string;

  @Column('varchar', { length: 50 })
  fullName!: string;

  @Column('varchar', { length: 15 })
  phone!: string;

  @Column('varchar', { length: 30 })
  country!: string;

  @Column('varchar', { length: 30 })
  city!: string;

  @Column('varchar', { length: 30 })
  state!: string;

  @Column('varchar', { length: 40 })
  postalCode!: string;

  @Column('varchar', { length: 50 })
  addressLine1!: string;

  @Column('varchar', { length: 50, nullable: true })
  addressLine2?: string;

  @CreateDateColumnTz()
  createdAt!: Date;

  @UpdateDateColumnTz()
  updatedAt!: Date;

  @DeleteDateColumnTz()
  deletedAt?: Date;

  @Column({ type: 'uuid', name: 'user_id' })
  @ForeignKey(() => UserEntity, (u) => u.id)
  userId!: string;
}

@Entity('order_addresses')
@Unique(['orderId', 'addressType'])
export class OrderAddressEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column({ type: 'varchar', length: 20 })
  addressType!: AddressType;
  @Column('varchar', { length: 50 })
  fullName!: string;

  @Column('varchar', { length: 15 })
  phone!: string;

  @Column('varchar', { length: 30 })
  country!: string;

  @Column('varchar', { length: 30 })
  city!: string;

  @Column('varchar', { length: 30 })
  state!: string;

  @Column('varchar', { length: 40 })
  postalCode!: string;

  @Column('varchar', { length: 50 })
  addressLine1!: string;

  @Column('varchar', { length: 50, nullable: true })
  addressLine2?: string;

  @CreateDateColumnTz()
  createdAt!: Date;
  @Column({ type: 'uuid', name: 'order_id' })
  @ForeignKey(() => OrderEntity, (o) => o.id)
  orderId!: string;
}
