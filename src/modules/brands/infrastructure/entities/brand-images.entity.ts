import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';
import {
  CreateDateColumnTz,
  UpdateDateColumnTz,
} from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { BrandEntity } from './brand.entity';

// allow one optional logo, and multiple banners.

@Entity('brand_images')
@Index('uq_brand_logo', ['brandId'], {
  unique: true,
  where: `"imageRole" = 'logo'`,
})
export class BrandImagesEntity {
  @UuidV7PrimaryColumn()
  id!: string;

  @Column()
  @ForeignKey(() => BrandEntity, (b) => b.id)
  brandId!: string;

  @Column()
  @ForeignKey(() => ImageEntity, (i) => i.id)
  imageId!: string;

  @Column({ type: 'varchar', length: 10 })
  imageRole!: 'banner' | 'logo';

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumnTz()
  createdAt!: Date;

  @UpdateDateColumnTz()
  updatedAt!: Date;
}
