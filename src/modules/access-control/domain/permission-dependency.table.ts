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

  register(perm: Permission, deps: Permission[]): this {
    this.table.set(perm.key(), new PermissionNode(perm, deps));
    return this;
  }

  compile(): PermissionDependencyTable {
    return new PermissionDependencyTable(this.table);
  }
}

class PermissionDependencyTable {
  constructor(private readonly table: ReadonlyMap<string, PermissionNode>) {}

  getDependenciesTreeFor(
    perm: Permission,
    depth = Number.POSITIVE_INFINITY,
  ): Permission[] {
    const collected = new Map<string, Permission>();
    const visiting = new Set<string>();

    const visit = (current: Permission, currentDepth: number): void => {
      if (currentDepth > depth) return;

      const key = current.key();
      const node = this.table.get(key);
      if (!node) return;

      if (visiting.has(key)) {
        throw new Error(`Circular permission dependency detected at "${key}"`);
      }

      visiting.add(key);

      for (const dep of node.dependencies) {
        const depKey = dep.key();

        if (!collected.has(depKey)) {
          collected.set(depKey, dep);
        }

        visit(dep, currentDepth + 1);
      }

      visiting.delete(key);
    };

    visit(perm, 1);

    return [...collected.values()];
  }

  getDirectDependenciesFor(perm: Permission): Permission[] {
    return [...(this.table.get(perm.key())?.dependencies ?? [])];
  }
}
const rolePermissions = AllPermissions.role;
export const permissionDepsTable = new PermissionDependencyTableBuilder()
  .register(rolePermissions.RoleAssignLessOrEqual, [
    rolePermissions.RoleReadLessOrEqual,
  ])
  .register(rolePermissions.RoleAssignLess, [
    rolePermissions.RoleReadLessOrEqual,
  ])
  .register(rolePermissions.RoleCreateLessOrEqual, [
    rolePermissions.RoleReadLessOrEqual,
  ])
  .register(rolePermissions.RoleDeleteLess, [
    rolePermissions.RoleCreateLessOrEqual,
  ])
  .register(rolePermissions.RoleRenameLessOrEqual, [
    // users can rename only what can they create
    rolePermissions.RoleCreateLessOrEqual,
  ])
  .register(rolePermissions.RoleReadLessOrEqual, [])
  .register(rolePermissions.RoleReloadAll, [])
  .compile();
