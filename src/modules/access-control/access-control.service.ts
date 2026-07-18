import { Injectable } from '@nestjs/common';
import { IRoleRepository } from './infrastructure/repositories/role.repository';
import { AccessControlSyncService } from './application/access-control-sync.service';
import { Permission } from './domain/permission';
import { CreateRoleDto } from './dto/create-role.dto';
import { IUserRepository } from '../users/infrastructure/repositories/user.repository';
import { SystemRolesRegistry } from './application/system-roles.registry';
import { RoleResponseDto } from './dto/role-response.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './domain/role';
import { SystemRoleError } from './application/system-roles.error';
import { RoleServiceError } from './access-control.error.service';

@Injectable()
export class AccessControlService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly roleRepo: IRoleRepository,
    private readonly systemRole: SystemRolesRegistry,
    private readonly acsyncService: AccessControlSyncService,
  ) {}
  async findAll(roleId: string): Promise<RoleResponseDto[]> {
    const roles = (await this.roleRepo.loadSimilarRoles(roleId)).unwrap();
    return roles.map((r) => r.toJSON());
  }
  async reloadPolicies() {
    await this.acsyncService.reloadFromDatabase();
  }
  async upsertRole(
    userRoleId: string,
    roleData: CreateRoleDto,
  ): Promise<RoleResponseDto> {
    if (this.systemRole.isSystemRoleName(roleData.name))
      throw new SystemRoleError(
        'Try to create/override an existing system role.',
      );

    const newRole = Role.create({
      name: roleData.name,
      permissions: roleData.permissions.map((p) =>
        Permission.fromPrimitives(p).unwrap(),
      ),
    }).unwrap();
    const userPerms = await this.acsyncService.getPermissions(userRoleId);
    if (!newRole.isSubsetOf(userPerms)) {
      throw new RoleServiceError(
        'Can not create role with permissions that are not owned by the user.',
      );
    }
    const role = (await this.roleRepo.upsert(newRole)).unwrap();
    await this.acsyncService.upsertRole(role);

    return role.toJSON();
  }
  async updateRole(
    userRoleId: string,
    roleId: string,
    updateData: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    if (this.systemRole.hasId(roleId))
      throw new SystemRoleError('Try to update an existing System Role.');
    const upRole = Role.restore({
      id: roleId,
      name: updateData.name,
      permissions: updateData.permissions.map((p) =>
        Permission.fromPrimitives(p).unwrap(),
      ),
    }).unwrap();
    const userPerms = await this.acsyncService.getPermissions(userRoleId);
    if (!upRole.isSubsetOf(userPerms)) {
      throw new RoleServiceError(
        'Can not update role with permissions that are not owned by the user.',
      );
    }
    const role = (await this.roleRepo.update(upRole)).unwrap();

    await this.acsyncService.upsertRole(role);
    return role.toJSON();
  }
  async removeRole(roleId: string): Promise<number> {
    const isSystemRole = this.systemRole.hasId(roleId);
    if (isSystemRole)
      throw new SystemRoleError('System roles cannot be removed');
    await this.userRepo.reassignUsersRole(
      roleId,
      this.systemRole.getCustomerRoleId(),
    );
    await this.acsyncService.removeRole(roleId);
    return (await this.roleRepo.removeById(roleId)).unwrap();
  }
}
