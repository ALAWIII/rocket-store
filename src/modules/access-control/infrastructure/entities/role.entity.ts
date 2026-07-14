import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Entity, Column, Index } from 'typeorm';

type PermissionJson = {
  entity: string;
  action: string;
  scope: string;
};

@Entity('roles')
export class RoleEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;

  @Index('idx_roles_permissions_gin', { synchronize: false })
  @Column({ type: 'jsonb', default: () => "'[]'" })
  permissions!: PermissionJson[];
}
