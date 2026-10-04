import { Role } from '../../domain/role';
import type { DBResult } from 'src/modules/shared/errors/error.types';

export abstract class IRoleRepository {
  abstract loadAll(): DBResult<Role[]>;
  abstract loadManageableRoles(roleId: string): DBResult<Role[]>;
  abstract loadAssignableRoles(roleId: string): DBResult<Role[]>;
  abstract loadCreatableRoles(roleId: string): DBResult<Role[]>;
  abstract loadByNames(names: string[]): DBResult<Role[]>;
  abstract findById(id: string): DBResult<Role>;
  abstract findByName(name: string): DBResult<Role>;
  abstract upsert(role: Role): DBResult<Role>;
  abstract create(role: Role, creatorRoleId: string): DBResult<Role>;
  abstract rename(data: { userRoleId: string; role: Role }): DBResult<Role>;
  abstract deleteById(ids: { requesterRoleId: string; targetRoleId: string; defaultRoleId: string }): DBResult<number>;
}
