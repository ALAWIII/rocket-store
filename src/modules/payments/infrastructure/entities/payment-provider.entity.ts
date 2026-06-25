import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';

@Entity('payment_providers')
export class PaymentProvider {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('varchar', { length: 30, unique: true })
  slug!: string;
  @Column('varchar', { length: 50 })
  displayName!: string;
  @Column('boolean', { default: true })
  isActive!: boolean;
  @Column('jsonb', { default: () => "'{}'" })
  config!: Record<string, unknown>;
  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn()
  updatedAt!: Date;
}
