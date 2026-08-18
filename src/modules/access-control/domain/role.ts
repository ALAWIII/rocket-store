import { Name } from 'src/modules/shared/value-objects/name';
import { AllPermissions, Permission } from './permission';
import { RoleId } from 'src/modules/shared/value-objects/ids';
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
    return this.build(RoleId.create().unwrap().toJSON(), data);
  }

  static restore(data: RolePropsPrimitives): Result<Role, RoleError> {
    return this.build(data.id, data);
  }
  private static build(
    id: string,
    data: {
      name: string;
      permissions: Permission[];
      assignScope?: Permission[];
      createScope?: Permission[];
    },
  ): Result<Role, RoleError> {
    const idd = RoleId.create(id).mapErr(
      (e) => new InvalidRoleValueError(e.message, e),
    );

    const name = Name.create(data.name).mapErr(
      (e) => new InvalidRoleValueError(e.message),
    );
    if (name.isErr()) return Err(name.error);

    const superPermsMap = this.toMap(data.permissions);

    //======================= validate if assign role permission persists and its scope permission list.
    const assignScopeMap = data.assignScope
      ? this.toMap(data.assignScope)
      : undefined;

    const assignScope = this.resolveScope(
      superPermsMap,
      AllPermissions.role.RoleAssignLessOrEqual.key(),
      'assignScope',
      assignScopeMap,
    );
    if (assignScope.isErr()) return Err(assignScope.error);
    const resolvedAssign = assignScope.unwrap();
    const assignResult = resolvedAssign
      ? this.validateSupersetPerms(
          superPermsMap,
          resolvedAssign,
          'assign scope',
        )
      : undefined;
    if (assignResult?.isErr()) return Err(assignResult.error);

    //======================= validate if create role permission persists and its scope permission list.
    const createScopeMap = data.createScope
      ? this.toMap(data.createScope)
      : undefined;
    const createScope = this.resolveScope(
      superPermsMap,
      AllPermissions.role.RoleCreateLessOrEqual.key(),
      'createScope',
      createScopeMap,
    );
    if (createScope.isErr()) return Err(createScope.error);

    const resolvedCreate = createScope.unwrap();
    const createResult = resolvedCreate
      ? this.validateSupersetPerms(
          superPermsMap,
          resolvedCreate,
          'create scope',
        )
      : undefined;
    if (createResult?.isErr()) return Err(createResult.error);
    //=======================
    return Ok(
      new Role({
        id: idd.unwrap(),
        name: name.unwrap(),
        permissions: superPermsMap,
        assignScope: assignScopeMap,
        createScope: createScopeMap,
      }),
    );
  }
  /**
   * checks the presence of special permissions and the presence of thier scope permissions lists.
   * @param superPermsMap
   * @param anyPermKey
   * @param scope
   * @param scopeName
   * @returns
   */
  private static resolveScope(
    superPermsMap: Map<string, Permission>,
    anyPermKey: string,
    scopeName: 'assignScope' | 'createScope',
    scope?: Map<string, Permission>,
  ): Result<Map<string, Permission> | undefined, InvalidRoleValueError> {
    const hasScopePerm = superPermsMap.has(anyPermKey);

    const hasScopeValues = !!scope && scope.size > 0;

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
    permScopes: Map<string, Permission>,
    scopeName: 'assign scope' | 'create scope',
  ): Result<boolean, InvalidPermissionSupersetError> {
    if (!this.isSuperSetOf(superPermsMap, permScopes)) {
      return Err(
        new InvalidPermissionSupersetError(
          `Main permissions map is not superset of ${scopeName} permissions.`,
        ),
      );
    }
    return Ok(true);
  }

  get permissionsLength(): number {
    return this.props.permissions.size;
  }
  get assignScopePermissionsLength(): number {
    return this.props.assignScope?.size ?? 0;
  }
  get createScopePermissionsLength(): number {
    return this.props.createScope?.size ?? 0;
  }
  private static toMap(permissions: Permission[]): Map<string, Permission> {
    return new Map(permissions.map((p) => [p.key(), p]));
  }
  static isSuperSetOf(
    superPermsMap: Map<string, Permission>,
    subsetPerms: Map<string, Permission>,
  ): boolean {
    if (superPermsMap.size < subsetPerms.size) return false;
    for (const perm of subsetPerms.values()) {
      if (!superPermsMap.has(perm.key())) {
        return false;
      }
    }
    return true;
  }

  findPermission(perm: Permission): Option<Permission> {
    const p = this.props.permissions.get(perm.key());
    return p ? Some(p) : None;
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
