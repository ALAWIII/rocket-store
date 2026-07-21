export abstract class RoleError extends Error {}

export class InvalidRoleValueError extends RoleError {}

export class InvalidPermissionSupersetError extends RoleError {}
