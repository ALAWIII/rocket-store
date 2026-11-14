import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey, Unique } from 'typeorm';
import { ProductEntity } from './product.entity';
import {
  CreateDateColumnTz,
  UpdateDateColumnTz,
} from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';
import { type ProductStatus } from '../../domain/product-status';

@Entity('product_variants', { synchronize: false })
@Unique('uq_title_product_id', ['productId', 'title'])
export class ProductVariantEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(
    () => ProductEntity,
    (p) => p.id,
    { onDelete: 'NO ACTION' },
  )
  productId!: string;
  @Column('varchar', { length: 50 })
  title!: string;
  @Column('integer')
  price!: number;

  @Column('jsonb', { default: () => `'{}'::jsonb` })
  info!: unknown;
  @Column('varchar', { length: 2000, nullable: true })
  description!: string | null;

  @Column('varchar', { length: 9 })
  status!: ProductStatus;

  @Column('integer')
  sortOrder!: number;
  @CreateDateColumnTz()
  createdAt!: Date;
  @UpdateDateColumnTz()
  updatedAt!: Date;
}
