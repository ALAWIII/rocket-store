import { Option } from 'ts-results-es';
import { Role } from '../../domain/role';
import type { DBResult } from 'src/modules/shared/errors/error.types';

export abstract class IRoleRepository {
  abstract loadAll(): Promise<DBResult<Role[]>>;
  abstract loadManageableRoles(roleId: string): Promise<DBResult<Role[]>>;
  abstract loadAssignableRoles(roleId: string): Promise<DBResult<Role[]>>;
  abstract loadCreatableRoles(roleId: string): Promise<DBResult<Role[]>>;
  abstract loadByNames(names: string[]): Promise<DBResult<Role[]>>;
  abstract findById(id: string): Promise<DBResult<Option<Role>>>;
  abstract findByName(name: string): Promise<DBResult<Option<Role>>>;
  abstract upsert(role: Role): Promise<DBResult<Role>>;
  abstract create(role: Role, creatorRoleId: string): Promise<DBResult<Role>>;
  abstract rename(data: {
    userRoleId: string;
    role: Role;
  }): Promise<DBResult<Role>>;
  abstract deleteById(ids: {
    requesterRoleId: string;
    targetRoleId: string;
    defaultRoleId: string;
  }): Promise<DBResult<number>>;
}
