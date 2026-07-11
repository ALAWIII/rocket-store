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

@Injectable()
export class AccessControlService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly roleRepo: IRoleRepository,
    private readonly systemRole: SystemRolesRegistry,
    private readonly acsyncService: AccessControlSyncService,
  ) {}
  async loadAll(): Promise<RoleResponseDto[]> {
    const roles = (await this.roleRepo.loadAll()).map((r) => r.toJSON());
    return roles;
  }
  async upsertRole(roleData: CreateRoleDto): Promise<RoleResponseDto | null> {
    if (this.systemRole.isSystemRoleName(roleData.name)) return null; // the null means, cant modify system Role

    const newRole = Role.create({
      name: roleData.name,
      permissions: roleData.permissions.map((p) =>
        Permission.fromPrimitives(p),
      ),
    });
    // make sure to handle when the upsertion success but no role were returned
    const role = await this.roleRepo.upsert(newRole);
    await this.acsyncService.upsertRole(role);

    return role.toJSON();
  }
  async updateRole(
    id: string,
    updateData: UpdateRoleDto,
  ): Promise<RoleResponseDto | null> {
    if (this.systemRole.hasId(id)) return null;
    const upRole = Role.restore({
      id,
      name: updateData.name,
      permissions: updateData.permissions.map((p) =>
        Permission.fromPrimitives(p),
      ),
    });
    const role = await this.roleRepo.update(upRole);
    await this.acsyncService.upsertRole(role);
    return role.toJSON();
  }
  async removeRole(roleId: string): Promise<number> {
    const isSystemRole = this.systemRole.hasId(roleId);
    if (isSystemRole) throw new Error('System roles cannot be removed');
    await this.userRepo.reassignUsersRole(
      roleId,
      this.systemRole.getCustomerRoleId(),
    );
    await this.acsyncService.removeRole(roleId);
    return await this.roleRepo.removeById(roleId);
  }
}
