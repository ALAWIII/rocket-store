import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Entity, Column, Index } from 'typeorm';
import { PermissionDatabaseDto } from '../dto/permission-database.dto';

@Entity('roles')
export class RoleEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;

  @Index('idx_roles_permissions_gin', { synchronize: false })
  @Column({ type: 'jsonb', default: () => "'[]'" })
  permissions!: PermissionDatabaseDto[];

  @Index('idx_roles_create_role_scope_gin', { synchronize: false })
  @Column({ name: 'create_scope', type: 'jsonb', nullable: true })
  createScope!: PermissionDatabaseDto[] | null;

  @Index('idx_roles_assign_role_scope_gin', { synchronize: false })
  @Column({ name: 'assign_scope', type: 'jsonb', nullable: true })
  assignScope!: PermissionDatabaseDto[] | null;
}
