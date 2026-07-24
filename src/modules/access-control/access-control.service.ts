import { Injectable, Logger } from '@nestjs/common';
import { IRoleRepository } from './infrastructure/repositories/role.repository';
import { AccessControlSyncService } from './application/access-control-sync.service';
import { AllPermissions, Permission } from './domain/permission';
import { CreateRoleDto } from './dto/create-role.dto';
import { IUserRepository } from '../users/infrastructure/repositories/user.repository';
import { SystemRolesRegistry } from './application/system-roles.registry';
import { RoleResponseDto } from './dto/role-response.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './domain/role';
import { SystemRoleError } from './application/system-roles.error';
import { RoleServiceError } from './access-control.error.service';
import { permissionDepsTable } from './domain/permission-dependency.table';

@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);

  constructor(
    private readonly userRepo: IUserRepository,
    private readonly roleRepo: IRoleRepository,
    private readonly systemRole: SystemRolesRegistry,
    private readonly acsyncService: AccessControlSyncService,
  ) {}
  async findAll(roleId: string): Promise<RoleResponseDto[]> {
    const roles = (await this.roleRepo.loadManageableRoles(roleId)).unwrap();
    this.logger.log(`Loaded ${roles.length} roles.`);
    return roles.map((r) => r.toJSON());
  }
  async reloadPolicies() {
    await this.acsyncService.reloadFromDatabase();
  }
  async createRole(
    userRoleId: string,
    roleData: CreateRoleDto,
  ): Promise<RoleResponseDto> {
    if (this.systemRole.isSystemRoleName(roleData.name))
      throw new SystemRoleError(
        'Try to create/override an existing system role.',
      );
    const permissions = roleData.permissions
      .map((p) => Permission.fromPrimitives(p).unwrap())
      .flatMap((p) => permissionDepsTable.getDependenciesTreeFor(p));
    const assignScope = roleData.assignScope
      ?.map((p) => Permission.fromPrimitives(p).unwrap())
      .flatMap((p) => permissionDepsTable.getDependenciesTreeFor(p));
    const createScope = roleData.createScope
      ?.map((p) => Permission.fromPrimitives(p).unwrap())
      .flatMap((p) => permissionDepsTable.getDependenciesTreeFor(p));
    // deduplication, normalization and subset validations are holded internally by .create() method call.
    const newRole = Role.create({
      name: roleData.name,
      permissions,
      assignScope,
      createScope,
    }).unwrap();
    this.logger.log(`New role instantiated.`, {
      roleId: newRole.id,
    });
    const userPerms = await this.acsyncService.getPermissions(userRoleId);
    if (newRole.isSupersetOf(userPerms)) {
      throw new RoleServiceError(
        'Can not create role with permissions that are not owned by the user.',
      );
    }
    const role = (await this.roleRepo.create(newRole, userRoleId)).unwrap();
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

    const [targetPerms, userPerms, canUpdateLessOrEqual] = await Promise.all([
      this.acsyncService.getPermissions(roleId),
      this.acsyncService.getPermissions(userRoleId),
      this.acsyncService.hasPolicy(
        userRoleId,
        AllPermissions.role.RoleUpdateLessOrEqual,
      ),
    ]);

    const targetRole = Role.restore({
      id: roleId,
      name: updateData.name,
      permissions: targetPerms,
    }).unwrap();

    if (targetRole.isProperSupersetOf(userPerms)) {
      throw new RoleServiceError(
        'Can not update role with permissions that are not owned by the user.',
      );
    }
    // this condition only after checking superset !!!
    const isEqual = targetPerms.length === userPerms.length;
    if (isEqual && !canUpdateLessOrEqual) {
      throw new RoleServiceError(
        'Cannot update a role at the same permission level without RoleUpdateLessOrEqual.',
      );
    }
    return (await this.roleRepo.rename(targetRole)).unwrap().toJSON();
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
    ).unwrap();
    const isRemoved = await this.acsyncService.removeRole(roleId);
    if (!isRemoved)
      throw new Error(
        `Failed to remove Casbin policies for role id: ${roleId}.`,
      );
    return deleteResult;
  }
}
