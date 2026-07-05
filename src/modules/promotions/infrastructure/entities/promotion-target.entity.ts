import { Column, Entity, ForeignKey } from 'typeorm';
import { PromotionEntity } from './promotion.entity';
import {
  PromotionTargetMode,
  PromotionTargetType,
} from '../../domain/promotion-target';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { CreateDateColumnTz } from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';

@Entity('promotion_targets')
export class PromotionTargetEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(() => PromotionEntity, (p) => p.id)
  promotionId!: string;
  @Column('varchar', { length: 30 })
  type!: PromotionTargetType;
  @Column('uuid')
  entityTargetId!: string;
  @Column('varchar', { length: 30 })
  mode!: PromotionTargetMode;
  @CreateDateColumnTz()
  createdAt!: Date;
}
