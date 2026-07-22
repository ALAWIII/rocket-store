import { Name } from 'src/modules/shared/value-objects/name';
import { AllPermissions, Permission } from './permission';
import { RoleId } from 'src/modules/shared/domain/ids';
import { Err, None, Ok, Option, Result, Some } from 'ts-results-es';
import {
  InvalidPermissionSupersetError,
  InvalidRoleValueError,
  RoleError,
} from './role.error';

type RoleProps = {
  id: RoleId;
  name: Name; // unique
  permissions: Map<string, Permission>;
  assignScope?: Map<string, Permission>;
  createScope?: Map<string, Permission>;
};
type RolePropsPrimitives = {
  id: string;
  name: string;
  permissions: Permission[];
  assignScope?: Permission[];
  createScope?: Permission[];
};
type CreateRoleProps = Omit<RolePropsPrimitives, 'id'>;

export class Role {
  private constructor(private readonly props: RoleProps) {}
  static create(data: CreateRoleProps): Result<Role, RoleError> {
    return this.build(RoleId.create(), data);
  }

  static restore(data: RolePropsPrimitives): Result<Role, RoleError> {
    return this.build(RoleId.create(data.id), data);
  }
  private static build(
    id: RoleId,
    data: {
      name: string;
      permissions: Permission[];
      assignScope?: Permission[];
      createScope?: Permission[];
    },
  ): Result<Role, RoleError> {
    const name = Name.create(data.name).mapErr(
      (e) => new InvalidRoleValueError(e.message),
    );
    if (name.isErr()) return Err(name.error);

    const superPermsMap = new Map(data.permissions.map((p) => [p.key(), p]));

    const assignScope = this.resolveScope(
      superPermsMap,
      AllPermissions.role.RoleAssignAny.key(),
      AllPermissions.role.RoleAssignOwn.key(),
      data.assignScope,
      'assignScope',
    );
    if (assignScope.isErr()) return Err(assignScope.error);
    const createScope = this.resolveScope(
      superPermsMap,
      AllPermissions.role.RoleCreateAny.key(),
      AllPermissions.role.RoleCreateOwn.key(),
      data.createScope,
      'createScope',
    );
    if (createScope.isErr()) return Err(createScope.error);

    const result = this.validateSupersetPerms(superPermsMap, {
      assignScope: assignScope.unwrap(),
      createScope: createScope.unwrap(),
    });
    if (result.isErr()) return Err(result.error);

    const resultUnwrap = result.unwrap();

    return Ok(
      new Role({
        id,
        name: name.unwrap(),
        permissions: superPermsMap,
        assignScope: resultUnwrap.assignScope.unwrapOr(undefined),
        createScope: resultUnwrap.createScope.unwrapOr(undefined),
      }),
    );
  }
  private static resolveScope(
    superPermsMap: ReadonlyMap<string, Permission>,
    anyPermKey: string,
    ownPermKey: string,
    scope: Permission[] | undefined,
    scopeName: 'assignScope' | 'createScope',
  ): Result<Permission[] | undefined, InvalidRoleValueError> {
    const hasScopePerm =
      superPermsMap.has(anyPermKey) || superPermsMap.has(ownPermKey);

    const hasScopeValues = !!scope && scope.length > 0;

    if (hasScopePerm !== hasScopeValues) {
      return Err(
        new InvalidRoleValueError(
          `${scopeName} must be provided if and only if its related scoped permission exists.`,
        ),
      );
    }

    return Ok(scope);
  }

  private static validateSupersetPerms(
    superPermsMap: Map<string, Permission>,
    permScopes: {
      assignScope?: Permission[];
      createScope?: Permission[];
    },
  ): Result<
    {
      assignScope: Option<Map<string, Permission>>;
      createScope: Option<Map<string, Permission>>;
    },
    InvalidPermissionSupersetError
  > {
    const result = {
      assignScope: None as Option<Map<string, Permission>>,
      createScope: None as Option<Map<string, Permission>>,
    };

    if (permScopes.assignScope) {
      if (!this.isSuperSetOf(superPermsMap, permScopes.assignScope)) {
        return Err(
          new InvalidPermissionSupersetError(
            'Main permissions map is not superset of assign scope permissions.',
          ),
        );
      }

      result.assignScope = Some(
        new Map(permScopes.assignScope.map((p) => [p.key(), p])),
      );
    }

    if (permScopes.createScope) {
      if (!this.isSuperSetOf(superPermsMap, permScopes.createScope)) {
        return Err(
          new InvalidPermissionSupersetError(
            'Main permissions map is not superset of create scope permissions.',
          ),
        );
      }

      result.createScope = Some(
        new Map(permScopes.createScope.map((p) => [p.key(), p])),
      );
    }

    return Ok(result);
  }

  private static isSuperSetOf(
    superPermsMap: Map<string, Permission>,
    subsetPerms: Permission[],
  ): boolean {
    if (superPermsMap.size < subsetPerms.length) return false;
    return subsetPerms.every((perm) => superPermsMap.has(perm.key()));
  }

  isSupersetOf(perms: Permission[]): boolean {
    return Role.isSuperSetOf(this.props.permissions, perms);
  }

  isAssignScopeSupersetOf(perms: Permission[]): boolean {
    const scope = this.props.assignScope;
    return scope ? Role.isSuperSetOf(scope, perms) : false;
  }

  isCreateScopeSupersetOf(perms: Permission[]): boolean {
    const scope = this.props.createScope;
    return scope ? Role.isSuperSetOf(scope, perms) : false;
  }
  findPermission(perm: Permission): Option<Permission> {
    const p = this.props.permissions.get(perm.key());
    return p ? Some(p) : None;
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
        permJson.visibility,
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
