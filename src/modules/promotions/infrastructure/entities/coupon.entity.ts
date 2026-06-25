import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import { Column, CreateDateColumn, Entity, ForeignKey, Index } from 'typeorm';
import { PromotionEntity } from './promotion.entity';

@Entity('coupons')
@Index(['code'], { unique: true })
export class CouponEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('varchar', { length: 50 })
  code!: string;
  @Column('uuid')
  @ForeignKey(() => PromotionEntity, (p) => p.id)
  promotionId!: string;
  @Column('boolean', { default: true })
  isActive!: boolean;
  @Column('uuid', { nullable: true })
  @ForeignKey(() => UserEntity, (u) => u.id)
  userId!: string | null;
  @CreateDateColumn()
  createdAt!: Date;
}
