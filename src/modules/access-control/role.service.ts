import { Injectable, Logger } from '@nestjs/common';
import { IRoleRepository } from './infrastructure/repositories/role.repository';
import { AccessControlSyncService } from './application/access-control-sync.service';
import { Permission } from './domain/permission';
import { CreateRoleDto } from './dto/create-role.dto';
import { SystemRolesRegistry } from './application/system-roles/system-roles.registry';
import { RoleResponseDto } from './dto/role-response.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './domain/role';
import { SystemRoleError } from './application/system-roles/system-roles.error';
import { RoleServiceError } from './role.error.service';
import { permissionDepsTable } from './domain/permission-dependency.table';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    private readonly roleRepo: IRoleRepository,
    private readonly systemRole: SystemRolesRegistry,
    private readonly acsyncService: AccessControlSyncService,
  ) {}
  async findAll(roleId: string): Promise<RoleResponseDto[]> {
    const roles = (
      await this.roleRepo.loadManageableRoles(roleId)
    ).unwrapOrThrow();
    this.logger.log(`Loaded ${roles.length} roles.`);
    return roles.map((r) => r.toJSON());
  }
  async findCreatedRoles(roleId: string): Promise<RoleResponseDto[]> {
    const roles = (
      await this.roleRepo.loadCreatableRoles(roleId)
    ).unwrapOrThrow();
    this.logger.log(`Loaded ${roles.length} creatable roles.`);
    return roles.map((r) => r.toJSON());
  }

  async findAssignableRoles(roleId: string): Promise<RoleResponseDto[]> {
    const roles = (
      await this.roleRepo.loadAssignableRoles(roleId)
    ).unwrapOrThrow();
    this.logger.log(`Loaded ${roles.length} assignable roles.`);
    return roles.map((r) => r.toJSON());
  }
  async reloadPolicies(): Promise<number> {
    return await this.acsyncService.reloadFromDatabase();
  }
  async createRole(
    userRoleId: string,
    roleData: CreateRoleDto,
  ): Promise<RoleResponseDto> {
    if (this.systemRole.isSystemRoleName(roleData.name))
      throw new SystemRoleError('Try to create an existing system role.');
    const permissions = roleData.permissions
      .map((p) => Permission.fromPrimitives(p).unwrapOrThrow())
      .flatMap((p) => permissionDepsTable.getDependenciesTreeFor(p));
    const assignScope = roleData.assignScope
      ?.map((p) => Permission.fromPrimitives(p).unwrapOrThrow())
      .flatMap((p) => permissionDepsTable.getDependenciesTreeFor(p));
    const createScope = roleData.createScope
      ?.map((p) => Permission.fromPrimitives(p).unwrapOrThrow())
      .flatMap((p) => permissionDepsTable.getDependenciesTreeFor(p));
    // deduplication, normalization and subset validations are holded internally by .create() method call.
    const newRole = Role.create({
      name: roleData.name,
      permissions,
      assignScope,
      createScope,
    }).unwrapOrThrow();

    this.logger.log(`New role instantiated.`, {
      roleId: newRole.id,
    });

    const role = (
      await this.roleRepo.create(newRole, userRoleId)
    ).unwrapOrThrow();
    await this.acsyncService.upsertRole(role);

    return role.toJSON();
  }
  async renameRole(
    userRoleId: string,
    roleId: string,
    updateData: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    if (this.systemRole.hasId(roleId))
      throw new SystemRoleError('Try to rename an existing System Role.');

    const targetRole = Role.restore({
      id: roleId,
      name: updateData.name,
      permissions: [],
    }).unwrapOrThrow();

    return (await this.roleRepo.rename({ role: targetRole, userRoleId }))
      .unwrapOrThrow()
      .toJSON();
  }
  async removeRole(userRoleId: string, roleId: string): Promise<number> {
    if (userRoleId === roleId) {
      throw new RoleServiceError(
        'Deleting user requester Role is forbidden, should only be able to delete other than his current role.',
      );
    }
    const isSystemRole = this.systemRole.hasId(roleId);
    if (isSystemRole) {
      throw new SystemRoleError('System roles cannot be removed');
    }
    const deleteResult = (
      await this.roleRepo.deleteById({
        requesterRoleId: userRoleId,
        targetRoleId: roleId,
        defaultRoleId: this.systemRole.getCustomerRoleId(),
      })
    ).unwrapOrThrow();
    const isRemoved = await this.acsyncService.removeRole(roleId);
    if (!isRemoved)
      throw new Error(
        `Failed to remove Casbin policies for role id: ${roleId}.`,
      );
    return deleteResult;
  }
}
