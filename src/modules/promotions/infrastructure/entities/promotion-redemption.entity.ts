import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey } from 'typeorm';
import { PromotionEntity } from './promotion.entity';
import { OrderEntity } from 'src/modules/orders/infrastructure/entities/order.entity';
import { CouponEntity } from './coupon.entity';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import { CreateDateColumnTz } from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';

@Entity('promotion_redemptions')
export class PromotionRedemptionEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(() => PromotionEntity, (p) => p.id)
  promotionId!: string;
  @Column('uuid')
  @ForeignKey(() => OrderEntity, (o) => o.id)
  orderId!: string;
  @Column('uuid', { nullable: true })
  @ForeignKey(() => CouponEntity, (c) => c.id)
  couponId!: string | null;
  @Column('uuid', { nullable: true })
  @ForeignKey(() => UserEntity, (u) => u.id)
  userId!: string | null;
  @Column('integer', { default: 0 })
  discountAmount!: number;
  @CreateDateColumnTz({ name: 'redeemed_at' })
  redeemedAt!: Date;
}
