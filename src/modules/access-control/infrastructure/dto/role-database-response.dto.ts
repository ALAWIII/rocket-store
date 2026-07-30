import { Expose } from 'class-transformer';
import { PermissionDatabaseDto } from './permission-database.dto';

export class RoleDatabaseDto {
  id!: string;
  name!: string;

  permissions!: PermissionDatabaseDto[];

  @Expose({ name: 'assign_scope' })
  assignScope!: PermissionDatabaseDto[] | null;

  @Expose({ name: 'create_scope' })
  createScope!: PermissionDatabaseDto[] | null;
}
