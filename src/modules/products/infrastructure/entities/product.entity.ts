import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { BrandEntity } from '../../../brands/infrastructure/entities/brand.entity';
import {
  CreateDateColumnTz,
  UpdateDateColumnTz,
} from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';
import { PageEntity } from 'src/modules/pages/infrastructure/entities/page.entity';
import { type ProductStatus } from '../../domain/product-status';

@Entity('products')
@Index('idx_products_page', ['pageId'])
@Index('idx_products_brand', ['brandId'])
@Index('idx_products_status', ['status'])
export class ProductEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('varchar', { length: 100 })
  title!: string;
  @Column('varchar', { length: 500 })
  description!: string;

  @Column('varchar', { length: 9 })
  status!: ProductStatus;
  @Column('uuid', { nullable: true })
  @ForeignKey(
    () => BrandEntity,
    (b) => b.id,
    { onDelete: 'SET NULL' },
  )
  brandId!: string | null;

  @Column('uuid', { nullable: true })
  @ForeignKey(
    () => PageEntity,
    (p) => p.id,
    { onDelete: 'SET NULL' },
  )
  pageId!: string | null;
  @CreateDateColumnTz()
  createdAt!: Date;
  @UpdateDateColumnTz()
  updatedAt!: Date;
}
