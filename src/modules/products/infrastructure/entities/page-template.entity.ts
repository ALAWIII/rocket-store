import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, CreateDateColumn, Entity, ForeignKey } from 'typeorm';
import { CategoryEntity } from './category.entity';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import { CreateDateColumnTz } from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';

@Entity('page_templates')
export class PageTemplateEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('varchar', { length: 500 })
  name!: string;
  @Column('jsonb')
  editorState!: Record<string, unknown>;
  @Column('text')
  renderedHtml!: string;

  @Column('uuid', { nullable: true })
  @ForeignKey(() => CategoryEntity, (c) => c.id, { onDelete: 'SET NULL' })
  categoryId?: string | null;
  @Column('uuid')
  @ForeignKey(() => UserEntity, (u) => u.id)
  createdBy!: string;
  @CreateDateColumnTz()
  createdAt!: Date;
}
