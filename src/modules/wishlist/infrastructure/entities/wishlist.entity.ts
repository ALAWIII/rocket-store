import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  UpdateDateColumn,
} from 'typeorm';

@Entity('wishlists')
export class WishlistEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(() => UserEntity, (u) => u.id)
  userId!: string;
  @Column('varchar', { length: 50 })
  name!: string;
  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn()
  updatedAt!: Date;
}
