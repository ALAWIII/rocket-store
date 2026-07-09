import { Injectable } from '@nestjs/common';
import { IRoleRepository } from './infrastructure/repositories/role.repository';
import { AccessControlSyncService } from './application/access-control-sync.service';
import { Permission } from './domain/permission';
import { CreateRoleDto } from './dto/create-role.dto';
import { IUserRepository } from '../users/infrastructure/repositories/user.repository';
import { SystemRolesRegistry } from './application/system-roles.registry';
import { ReassignRoleDto } from './dto/reassign-role.dto';

@Injectable()
export class AccessControlService {
  constructor(
    private readonly roleRepo: IRoleRepository,
    private readonly acsyncSerivce: AccessControlSyncService,
    private readonly userRepo: IUserRepository,
    private readonly systemRole: SystemRolesRegistry,
  ) {}
  async createRole(roleData: CreateRoleDto): Promise<string | null> {
    if (this.systemRole.isSystemRoleName(roleData.name)) return null; // the null means, cant modify system Role

    const perms = roleData.permissions.map((p) =>
      Permission.fromString(`${p.entity}.${p.action}.${p.scope}`),
    );
    // make sure to handle when the upsertion success but no role were returned
    const role = await this.roleRepo.upsertByName(roleData.name, perms);
    await this.acsyncSerivce.upsertRole(role);

    return role.id;
  }
  async removeRole(roleId: string): Promise<number> {
    const isSystemRole = this.systemRole.hasId(roleId);
    if (isSystemRole) throw new Error('System roles cannot be removed');
    await this.userRepo.reassignUsersRole(
      roleId,
      this.systemRole.getCustomerRoleId(),
    );
    await this.acsyncSerivce.removeRole(roleId);
    return await this.roleRepo.removeById(roleId);
  }
  async reassignRole(idData: ReassignRoleDto): Promise<number> {
    return await this.userRepo.reassignUsersRole(idData.oldId, idData.newId);
  }
}
