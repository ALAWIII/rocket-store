import { RoleEntity } from 'src/modules/access-control/infrastructure/entities/role.entity';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import {
  Entity,
  Column,
  ForeignKey,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('varchar', { name: 'name', length: 30 })
  name!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  givenName!: string;
  @Column({ type: 'varchar', length: 30, nullable: true })
  familyName!: string;
  @Column('text', { name: 'email', unique: true })
  email!: string;

  @Column('boolean', { name: 'emailVerified', default: false })
  emailVerified!: boolean;

  @Column({ nullable: true })
  phone!: string | null;
  @Column('text', { name: 'image', nullable: true })
  image!: string | null;

  @Column({ type: 'uuid', name: 'role_id' })
  @ForeignKey(() => RoleEntity, (r) => r.id)
  roleId!: string;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updatedAt' })
  updatedAt!: Date;
  @CreateDateColumn({ type: 'timestamptz', name: 'createdAt' })
  createdAt!: Date;
}
