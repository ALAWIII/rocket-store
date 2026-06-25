import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, CreateDateColumn, Entity } from 'typeorm';
import {
  DiscountType,
  PromotionStatus,
  PromotionType,
} from '../../domain/promotion';

@Entity('promotions')
export class PromotionEntity {
  @UuidV7PrimaryColumn()
  id!: string;

  @Column('varchar', { length: 120 })
  name!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('varchar', { length: 30 })
  type!: PromotionType;

  @Column('varchar', { length: 30 })
  status!: PromotionStatus;

  @Column('varchar', { length: 30 })
  discountType!: DiscountType;

  @Column('numeric', { precision: 10, scale: 2 })
  value!: number;

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  maxDiscountAmount!: number | null;

  @Column('timestamptz', { nullable: true })
  startsAt!: Date | null;

  @Column('timestamptz', { nullable: true })
  endsAt!: Date | null;

  @Column('integer', { nullable: true })
  usageLimit!: number | null;

  @Column('integer', { default: 0 })
  usageCount!: number;

  @Column('integer', { nullable: true })
  perUserLimit!: number | null;

  @Column('boolean', { default: false })
  stackable!: boolean;

  @Column('integer', { default: 0 })
  priority!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
