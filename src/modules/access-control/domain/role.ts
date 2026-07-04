import { Name } from 'src/modules/shared/value-objects/name';
import { Permission } from './permission';
import { RoleId } from 'src/modules/shared/domain/ids';

export class Role {
  constructor(
    private readonly _id: RoleId,
    private _name: Name, // unique
    private permissions: Permission[],
  ) {}
  findPermission(perm: Permission): number {
    return this.permissions.findIndex((p) => p.equals(perm));
  }
  addPermission(perm: Permission) {
    const index = this.findPermission(perm);
    if (index >= 0) return;

    this.permissions.push(perm);
  }
  removePermission(perm: Permission) {
    const index = this.findPermission(perm);
    if (index < 0) return;
    this.permissions.splice(index, 1);
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
  toJSON() {
    return {
      id: this._id,
      name: this._name,
      permissions: this.permissions.map((p) => p),
    };
  }
}
