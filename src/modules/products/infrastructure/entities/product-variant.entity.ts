import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey } from 'typeorm';
import { ProductEntity } from './product.entity';
import {
  CreateDateColumnTz,
  UpdateDateColumnTz,
} from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';
import { type ProductStatus } from '../../domain/product-status';

@Entity('product_variants')
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
  @Column('integer')
  price!: number;
  @Column('integer')
  quantity!: number;
  @Column('jsonb', { default: () => `'{}'::jsonb` })
  info!: Record<string, unknown>;
  @Column('varchar', { length: 500, nullable: true })
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
