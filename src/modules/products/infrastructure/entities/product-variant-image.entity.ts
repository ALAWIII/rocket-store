import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey } from 'typeorm';
import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';
import { ProductVariantEntity } from './product-variant.entity';
import {
  CreateDateColumnTz,
  UpdateDateColumnTz,
} from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';

@Entity('product_variant_images')
export class ProductVariantImageEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(
    () => ImageEntity,
    (img) => img.id,
    { onDelete: 'CASCADE' },
  )
  imageId!: string;
  @Column('uuid')
  @ForeignKey(
    () => ProductVariantEntity,
    (p) => p.id,
    { onDelete: 'CASCADE' },
  )
  productVariantId!: string;

  @Column('integer')
  sortOrder!: number;

  @CreateDateColumnTz()
  createdAt!: Date;
  @UpdateDateColumnTz()
  updatedAt!: Date;
}
