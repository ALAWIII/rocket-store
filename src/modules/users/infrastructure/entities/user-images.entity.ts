import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';
import { CreateDateColumnTz } from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('user_images')
@Index('uq_user_image', ['userId'], {
  unique: true,
})
export class UserImagesEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column({ type: 'uuid' })
  @ForeignKey(() => UserEntity, (i) => i.id, { onDelete: 'CASCADE' })
  userId!: string;
  @Column({ type: 'uuid' })
  @ForeignKey(() => ImageEntity, (i) => i.id, { onDelete: 'CASCADE' })
  imageId!: string;
  @CreateDateColumnTz()
  createdAt!: string;
}
