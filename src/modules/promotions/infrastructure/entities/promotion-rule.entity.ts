import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, CreateDateColumn, Entity, ForeignKey } from 'typeorm';
import { PromotionEntity } from './promotion.entity';

@Entity('promotion_rules')
export class PromotionRule {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(() => PromotionEntity, (p) => p.id)
  promotionId!: string;
  @Column('varchar', { length: 40 })
  ruleType!: string;
  @Column('jsonb')
  ruleData!: Record<string, unknown>;
  @CreateDateColumn()
  createdAt!: Date;
}
