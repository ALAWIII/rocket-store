import { Name } from 'src/modules/shared/value-objects/name';
import { Permission } from './permission';
import { RoleId } from 'src/modules/shared/domain/ids';

export class Role {
  constructor(
    private readonly _id: RoleId,
    private _name: Name, // unique
    private _permissions: Permission[],
  ) {}
  findPermission(perm: Permission): number {
    return this._permissions.findIndex((p) => p.equals(perm));
  }
  addPermission(perm: Permission) {
    const index = this.findPermission(perm);
    if (index >= 0) return;

    this._permissions.push(perm);
  }
  removePermission(perm: Permission) {
    const index = this.findPermission(perm);
    if (index < 0) return;
    this._permissions.splice(index, 1);
  }
  setName(name: string) {
    this._name = Name.create(name);
  }
  get name(): string {
    return this._name.value;
  }
  get id(): string {
    return this._id.toString();
  }
  get permissions(): Permission[] {
    return this._permissions;
  }

  toFlatPermissions(): string[][] {
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
      id: this._id,
      name: this._name,
      permissions: this._permissions.map((p) => p),
    };
  }
}
