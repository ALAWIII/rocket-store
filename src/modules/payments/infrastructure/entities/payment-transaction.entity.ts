import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey } from 'typeorm';
import { PaymentStatus } from '../../domain/payment-status';
import { PaymentEntity } from './payment.entity';
import { PaymentProviderEntity } from './payment-provider.entity';
import {
  CreateDateColumnTz,
  UpdateDateColumnTz,
} from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';

@Entity('payment_transactions')
export class PaymentTransactionEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('varchar', { length: 30 })
  status!: PaymentStatus;

  @Column('uuid')
  @ForeignKey(() => PaymentEntity, (p) => p.id)
  paymentId!: string;
  @Column('uuid')
  @ForeignKey(() => PaymentProviderEntity, (p) => p.id)
  providerId!: string;
  @Column('text')
  gatewayTransactionId!: string;
  @Column('text', { nullable: true })
  gatewayCustomerId?: string | null;
  @Column('integer')
  amountInMinorUnit!: number;

  @Column('jsonb')
  rawPayload!: Record<string, unknown>;

  @Column('varchar', { length: 4, nullable: true })
  cardLast4!: string | null;

  @Column('varchar', { length: 30, nullable: true })
  cardBrand!: string | null;

  @Column('text', { nullable: true })
  receiptUrl!: string | null;

  @CreateDateColumnTz()
  createdAt!: Date;

  @UpdateDateColumnTz()
  updatedAt!: Date;
}
