import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, CreateDateColumn, Entity, ForeignKey } from 'typeorm';
import { ImageEntity } from './image.entity';
import { ImageAttachmentEntityType } from '../../domain/image-attachment-type';
import { ImageAttachmentRole } from '../../domain/image-attachment-role';

@Entity('image_attachments')
export class ImageAttachmentEntity {
  @UuidV7PrimaryColumn()
  id!: string;

  @Column('uuid')
  @ForeignKey(() => ImageEntity, (i) => i.id)
  imageId!: string;
  @Column('varchar', { length: 50 })
  entityType!: ImageAttachmentEntityType;
  @Column('uuid')
  entityId!: string;
  @Column('varchar', { length: 30 })
  role!: ImageAttachmentRole;
  @Column('integer', { default: 0 })
  sortOrder!: number;
  @Column('boolean', { default: false })
  isPrimary!: boolean;
  @CreateDateColumn()
  createdAt!: Date;
}
