import { CreateDateColumnTz } from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { type ImageMimeTypes } from 'src/modules/shared/value-objects/image-mime-type';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import { Column, Entity, ForeignKey } from 'typeorm';

@Entity('images')
export class ImageEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('varchar', { length: 50 })
  name!: string;
  @Column('varchar', { length: 64 })
  checksum!: string;
  @Column('varchar', { length: 20 })
  mimeType!: ImageMimeTypes;
  @Column('bigint')
  sizeBytes!: number;
  @Column('integer')
  width!: number;
  @Column('integer')
  height!: number;
  @Column('varchar', { length: 125, nullable: true })
  altText!: string | null;
  @Column({ type: 'uuid', nullable: true })
  @ForeignKey(() => UserEntity, (u) => u.id, { onDelete: 'SET NULL' })
  uploadedBy!: string | null;
  @CreateDateColumnTz()
  createdAt!: Date;
}
