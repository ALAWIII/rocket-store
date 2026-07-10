import { Permission } from '../../domain/permission';
import { Role } from '../../domain/role';

type RolePromise = Promise<Role | null>;
export abstract class IRoleRepository {
  abstract loadAll(): Promise<Role[]>;
  abstract loadByNames(names: string[]): Promise<Role[]>;
  abstract findById(id: string): RolePromise;
  abstract findByName(name: string): RolePromise;
  abstract upsertByName(name: string, perms: Permission[]): Promise<Role>;
  abstract update(role: Role): Promise<Role>;
  abstract removeById(id: string): Promise<number>;
}
