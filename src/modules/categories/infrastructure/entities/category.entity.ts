import { CreateDateColumnTz } from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey } from 'typeorm';

@Entity('categories')
export class CategoryEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('varchar', { length: 50 }) // categories with same name may be children of other categories
  name!: string;
  @Column('uuid', { nullable: true })
  @ForeignKey(() => CategoryEntity, (c) => c.id, { onDelete: 'SET NULL' })
  parentCategoryId!: string | null;
  @CreateDateColumnTz()
  createdAt!: Date;
}
