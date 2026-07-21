import { Name } from 'src/modules/shared/value-objects/name';
import { Permission } from './permission';
import { RoleId } from 'src/modules/shared/domain/ids';
import { Err, None, Ok, Option, Result, Some } from 'ts-results-es';
import { InvalidValueObjectError } from 'src/modules/shared/value-objects/value-object.error';

type RoleProps = {
  id: RoleId;
  name: Name; // unique
  permissions: Map<string, Permission>;
  assignScope?: Map<string, Permission>;
  createScope?: Map<string, Permission>;
};
type CreateRoleProps = Omit<RoleProps, 'id'> & { name: string };
type RestoreRoleProps = CreateRoleProps & { id: string };
export class Role {
  private constructor(private readonly props: RoleProps) {}
  static create(
    roleData: CreateRoleProps,
  ): Result<Role, InvalidValueObjectError> {
    return Name.create(roleData.name).map(
      (name) => new Role({ id: RoleId.create(), ...roleData, name }),
    );
  }
  static restore(
    data: RestoreRoleProps,
  ): Result<Role, InvalidValueObjectError> {
    const name = Name.create(data.name);
    if (name.isErr()) return Err(name.error);
    return Ok(
      new Role({ ...data, id: RoleId.create(data.id), name: name.unwrap() }),
    );
  }
  findPermission(perm: Permission): Option<Permission> {
    const p = this.props.permissions.get(perm.key());
    return p ? Some(p) : None;
  }
  isSupersetOf(perms: readonly Permission[]): boolean {
    const localPerms = this.props.permissions;
    return (
      localPerms.size >= perms.length &&
      perms.every((perm) => localPerms.has(perm.key()))
    );
  }
  isAssignScopeSupersetOf(perms: readonly Permission[]): boolean {
    const scope = this.props.assignScope;
    if (!scope || scope.size < perms.length) return false;
    return perms.every((perm) => scope.has(perm.key()));
  }

  isCreateScopeSupersetOf(perms: readonly Permission[]): boolean {
    const scope = this.props.createScope;
    if (!scope || scope.size < perms.length) return false;
    return perms.every((perm) => scope.has(perm.key()));
  }
  addPermission(perm: Permission) {
    this.props.permissions.set(perm.key(), perm);
  }
  removePermission(perm: Permission) {
    this.props.permissions.delete(perm.key());
  }
  setName(name: string) {
    this.props.name = Name.create(name).unwrap();
  }
  get name(): string {
    return this.props.name.value;
  }
  get id(): string {
    return this.props.id.toString();
  }
  get permissions(): Readonly<Permission[]> {
    const perms = [...this.props.permissions.values()];
    perms.sort((p1, p2) => p1.key().localeCompare(p2.key()));
    return perms;
  }
  get assignScopePermissions(): Option<Readonly<Permission[]>> {
    if (!this.props.assignScope) {
      return None;
    }
    const perms = [...this.props.assignScope.values()];
    perms.sort((p1, p2) => p1.key().localeCompare(p2.key()));
    return Some(perms);
  }
  get createScopePermissions(): Option<Readonly<Permission[]>> {
    if (!this.props.createScope) {
      return None;
    }
    const perms = [...this.props.createScope.values()];
    perms.sort((p1, p2) => p1.key().localeCompare(p2.key()));
    return Some(perms);
  }
  toFlatPolicies(): string[][] {
    const permList: string[][] = [];
    for (const perm of this.permissions) {
      const permJson = perm.toJSON();
      permList.push([
        this.id,
        permJson.entity,
        permJson.action,
        permJson.scope,
      ]);
    }
    return permList;
  }
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      permissions: this.permissions.map((p) => p.toJSON()),
      assignScope: this.assignScopePermissions
        .map((ps) => ps.map((p) => p.toJSON()))
        .unwrapOr(undefined),
      createScope: this.createScopePermissions
        .map((ps) => ps.map((p) => p.toJSON()))
        .unwrapOr(undefined),
    };
  }
}
