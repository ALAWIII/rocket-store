import { RoleEntity } from 'src/modules/access-control/infrastructure/entities/role.entity';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @CreateDateColumn()
  createdAt!: Date;
  @CreateDateColumn()
  updatedAt!: Date;
  @Column({ type: 'varchar', length: 254 })
  email!: string;
  @Column()
  passwordHash!: string;
  @Column({ type: 'varchar', length: 50 })
  firstName!: string;
  @Column({ type: 'varchar', length: 50 })
  lastName!: string;
  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'uuid', name: 'role_id' })
  roleId!: string;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;
}
