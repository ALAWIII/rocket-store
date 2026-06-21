import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('roles')
export class RoleEntity {
  @PrimaryColumn('uuid', { default: () => 'uuidv7' })
  id!: string;
  @Column({ type: 'varchar', length: 20, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 10 })
  roleType!: string;
}
