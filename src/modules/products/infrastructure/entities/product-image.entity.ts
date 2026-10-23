import { Column, Entity, ForeignKey } from 'typeorm';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';
import { ProductEntity } from './product.entity';
import { CreateDateColumnTz } from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';

@Entity('product_images')
export class ProductImageEntity {
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
    () => ProductEntity,
    (p) => p.id,
    { onDelete: 'CASCADE' },
  )
  productId!: string;
  @CreateDateColumnTz()
  createdAt!: Date;
}
