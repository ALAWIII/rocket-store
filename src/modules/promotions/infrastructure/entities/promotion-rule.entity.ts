import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey } from 'typeorm';
import { PromotionEntity } from './promotion.entity';
import { CreateDateColumnTz } from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';

@Entity('promotion_rules')
export class PromotionRuleEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(() => PromotionEntity, (p) => p.id)
  promotionId!: string;
  @Column('varchar', { length: 40 })
  ruleType!: string;
  @Column('jsonb')
  ruleData!: Record<string, unknown>;
  @CreateDateColumnTz()
  createdAt!: Date;
}
