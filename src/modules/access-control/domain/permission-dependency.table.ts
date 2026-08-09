import { AllPermissions, Permission } from './permission';

class PermissionNode {
  constructor(
    private readonly _permission: Permission,
    private readonly _deps: readonly Permission[],
  ) {}

  get permission(): Permission {
    return this._permission;
  }

  get dependencies(): readonly Permission[] {
    return this._deps;
  }
}

class PermissionDependencyTableBuilder {
  private readonly table = new Map<string, PermissionNode>();
  mergeFrom(table: ReadonlyMap<string, PermissionNode>): this {
    for (const [perm, permNode] of table) {
      this.table.set(perm, permNode);
    }
    return this;
  }
  register(perm: Permission, deps: Permission[]): this {
    this.table.set(perm.key(), new PermissionNode(perm, deps));
    return this;
  }
  getTable(): ReadonlyMap<string, PermissionNode> {
    return this.table;
  }
  compile(): PermissionDependencyTable {
    return new PermissionDependencyTable(this.table);
  }
}

class PermissionDependencyTable {
  constructor(private readonly table: ReadonlyMap<string, PermissionNode>) {}

  getDependenciesFor(
    permission: Permission,
    maxDepth = Number.POSITIVE_INFINITY,
  ): Permission[] {
    const collected = new Map<string, Permission>();
    const visiting = new Set<string>();

    const visit = (current: Permission, depth: number): void => {
      const key = current.key();

      if (visiting.has(key)) {
        throw new Error(`Circular permission dependency detected at "${key}"`);
      }

      if (collected.has(key)) {
        return;
      }

      visiting.add(key);

      try {
        if (depth < maxDepth) {
          const node = this.table.get(key);

          for (const dependency of node?.dependencies ?? []) {
            visit(dependency, depth + 1);
          }
        }

        collected.set(key, current);
      } finally {
        visiting.delete(key);
      }
    };

    visit(permission, 0);

    return [...collected.values()];
  }

  getDirectDependenciesFor(perm: Permission): Permission[] {
    return [...(this.table.get(perm.key())?.dependencies ?? [])];
  }
}
const roleTable = new PermissionDependencyTableBuilder()
  .register(AllPermissions.role.RoleAssignLessOrEqual, [
    AllPermissions.role.RoleReadLessOrEqual,
  ])
  .register(AllPermissions.role.RoleCreateLessOrEqual, [
    AllPermissions.role.RoleReadLessOrEqual,
  ])
  .register(AllPermissions.role.RoleDeleteLess, [
    AllPermissions.role.RoleCreateLessOrEqual,
  ])
  .register(AllPermissions.role.RoleRenameLessOrEqual, [
    // users can rename only what can they create
    AllPermissions.role.RoleCreateLessOrEqual,
  ])
  .register(AllPermissions.role.RoleReadLessOrEqual, [])
  .register(AllPermissions.role.RoleReloadAll, [])
  .getTable();

const userTable = new PermissionDependencyTableBuilder()
  .register(AllPermissions.user.UserReadLessOrEqual, [])
  .getTable();

export const permissionDepsTable = new PermissionDependencyTableBuilder()
  .mergeFrom(roleTable)
  .mergeFrom(userTable)
  .compile();
// permissionDepsTable
