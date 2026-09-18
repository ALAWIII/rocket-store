import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';
import { CreateDateColumnTz } from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { BrandEntity } from './brand.entity';
import { type BrandImageRole } from '../../domain/brand-image';

// allow one optional logo, and multiple banners.
// an image is only attached once per brand, no same imageId can be attached on same brand.
@Entity('brand_images')
@Index('uq_brand_logo', ['brandId'], {
  unique: true,
  where: `"imageRole" = 'logo'`,
})
@Index('uq_brand_image', ['brandId', 'imageId'], {
  unique: true,
})
export class BrandImagesEntity {
  @UuidV7PrimaryColumn()
  id!: string;

  @Column({ type: 'uuid' })
  @ForeignKey(() => BrandEntity, (b) => b.id, { onDelete: 'CASCADE' })
  brandId!: string;

  @Column({ type: 'uuid' })
  @ForeignKey(() => ImageEntity, (i) => i.id, { onDelete: 'CASCADE' })
  imageId!: string;

  @Column({ type: 'varchar', length: 10 })
  imageRole!: BrandImageRole;

  @CreateDateColumnTz()
  createdAt!: Date;
}
