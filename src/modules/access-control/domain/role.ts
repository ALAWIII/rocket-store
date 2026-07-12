import { Name } from 'src/modules/shared/value-objects/name';
import { Permission } from './permission';
import { RoleId } from 'src/modules/shared/domain/ids';
import { Result } from 'ts-results-es';
import { InvalidValueObjectError } from 'src/modules/shared/value-objects/value-object.error';

export class Role {
  private constructor(
    private readonly _id: RoleId,
    private _name: Name, // unique
    private _permissions: Permission[],
  ) {}
  static create(roleData: {
    name: string;
    permissions: Permission[];
  }): Result<Role, InvalidValueObjectError> {
    return Name.create(roleData.name).map(
      (name) => new Role(RoleId.create(), name, roleData.permissions),
    );
  }
  static restore(data: {
    id: string;
    name: string;
    permissions: Permission[];
  }): Role {
    return new Role(
      RoleId.create(data.id),
      Name.create(data.name).unwrap(),
      data.permissions,
    );
  }
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
    this._name = Name.create(name).unwrap();
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
    };
  }
}
