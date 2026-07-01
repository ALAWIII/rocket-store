import { Permission } from '../../domain/permission';
import { Role } from '../../domain/role';

type RolePromise = Promise<Role | null>;

export abstract class IRoleRepository {
  abstract loadAll(): Promise<Role[]>;
  abstract findById(id: string): RolePromise;
  abstract findByName(name: string): RolePromise;
  abstract upsertByName(name: string, perms: Permission[]): RolePromise;
  abstract updateById(id: string, perms: Permission[]): RolePromise;
}
