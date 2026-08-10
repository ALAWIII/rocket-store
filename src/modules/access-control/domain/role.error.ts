export abstract class RoleError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });

    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class InvalidRoleValueError extends RoleError {}

export class InvalidPermissionSupersetError extends RoleError {}
