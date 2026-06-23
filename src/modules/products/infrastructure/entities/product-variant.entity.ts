import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, CreateDateColumn, Entity, ForeignKey } from 'typeorm';
import { ProductEntity } from './product.entity';

@Entity('product_variants')
export class ProductVariantEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(() => ProductEntity, (p) => p.id)
  productId!: string;
  @Column('integer')
  price!: number;
  @Column('integer')
  quantity!: number;
  @Column('jsonb')
  info!: Record<string, unknown>;
  @Column('varchar', { length: 500, nullable: true })
  description?: string | null;
  @CreateDateColumn()
  createdAt!: Date;
}
