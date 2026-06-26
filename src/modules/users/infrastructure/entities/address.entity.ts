import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { AddressType } from '../../domain/address';
import { OrderEntity } from 'src/modules/orders/infrastructure/entities/order.entity';

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;
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

  @CreateDateColumn()
  createdAt!: Date;
  @Column({ type: 'uuid', name: 'order_id' })
  orderId!: string;
  @ManyToOne(() => OrderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;
}
