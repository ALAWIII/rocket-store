import { CreateDateColumnTz } from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { type CategoryImageRole } from '../../domain/category-image';
import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';
import { CategoryEntity } from './category.entity';

@Entity('category_images')
@Index('uq_category_icon', ['categoryId'], {
  unique: true,
  where: `"imageRole" = 'icon'`,
})
@Index('uq_category_thumbnail', ['categoryId'], {
  unique: true,
  where: `"imageRole" = 'thumbnail'`,
})
@Index('uq_category_image', ['categoryId', 'imageId'], {
  unique: true,
})
export class CategoryImagesEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(
    () => ImageEntity,
    (im) => im.id,
    { onDelete: 'CASCADE' },
  )
  imageId!: string;
  @Column('uuid')
  @ForeignKey(
    () => CategoryEntity,
    (c) => c.id,
    { onDelete: 'CASCADE' },
  )
  categoryId!: string;
  @Column('varchar', { length: 10 })
  imageRole!: CategoryImageRole;
  @CreateDateColumnTz()
  createdAt!: Date;
}
