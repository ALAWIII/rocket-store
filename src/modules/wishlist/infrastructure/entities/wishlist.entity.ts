import {
  CreateDateColumnTz,
  UpdateDateColumnTz,
} from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import { Column, Entity, ForeignKey } from 'typeorm';

@Entity('wishlists')
export class WishlistEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(() => UserEntity, (u) => u.id)
  userId!: string;
  @Column('varchar', { length: 50 })
  name!: string;
  @CreateDateColumnTz()
  createdAt!: Date;
  @UpdateDateColumnTz()
  updatedAt!: Date;
}
