import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Entity, Column } from 'typeorm';

@Entity('roles')
export class RoleEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column({ type: 'varchar', length: 20, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 10 })
  roleType!: string;
}
