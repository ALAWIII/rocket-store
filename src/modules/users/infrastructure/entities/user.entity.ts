import { RoleEntity } from 'src/modules/access-control/infrastructure/entities/role.entity';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import {
  Entity,
  Column,
  ForeignKey,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User as TUser } from 'typeorm/entities/User';

@Entity('users')
export class UserEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column({ type: 'text', unique: true, name: 'auth_id' })
  authId!: string;

  @OneToOne(() => TUser, { eager: true })
  @JoinColumn({ name: 'auth_id', referencedColumnName: 'id' })
  authUser!: TUser;
  @Column({ type: 'varchar', length: 50 })
  givenName!: string;
  @Column({ type: 'varchar', length: 50 })
  familyName!: string;
  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'uuid', name: 'role_id' })
  @ForeignKey(() => RoleEntity, (r) => r.id)
  roleId!: string;
  @UpdateDateColumn()
  updatedAt!: Date;
}
