import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from '../../domain/payment-status';
import { OrderEntity } from 'src/modules/orders/infrastructure/entities/order.entity';
import { PaymentMethod } from '../../domain/payment-method';

@Entity('payments')
export class PaymentEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column({ type: 'timestamptz', nullable: true })
  paidAt!: Date | null;
  @Column('uuid')
  @ForeignKey(() => OrderEntity, (o) => o.id)
  orderId!: string;
  @Column('integer', { default: 0 })
  amountInMinorUnit!: number;
  @Column('varchar', { length: 10 })
  currency!: string;
  @Column('varchar', { length: 20 })
  status!: PaymentStatus;
  @Column('varchar', { length: 20 })
  method!: PaymentMethod;
  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn()
  updatedAt!: Date;
}
