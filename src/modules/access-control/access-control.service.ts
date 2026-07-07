import { Injectable } from '@nestjs/common';
import { IRoleRepository } from './infrastructure/repositories/role.repository';
import { AccessControlSyncService } from './application/access-control-sync.service';
import { Permission } from './domain/permission';
import { CreateRoleDto } from './dto/create-role.dto';
import { IUserRepository } from '../users/infrastructure/repositories/user.repository';
import { SystemRolesRegistry } from './application/system-roles.registry';

@Injectable()
export class AccessControlService {
  constructor(
    private readonly roleRepo: IRoleRepository,
    private readonly acsyncSerivce: AccessControlSyncService,
    private readonly userRepo: IUserRepository,
    private readonly systemRole: SystemRolesRegistry,
  ) {}
  async createRole(roleData: CreateRoleDto): Promise<string | null> {
    const perms = roleData.permissions.map((p) =>
      Permission.fromString(`${p.entity}.${p.action}.${p.scope}`),
    );
    const role = await this.roleRepo.upsertByName(roleData.name, perms);
    if (role !== null) {
      await this.acsyncSerivce.upsertRole(role);
    }
    return role?.id ?? null;
  }
  async removeRole(roleId: string) {
    const isSystemRole = this.systemRole.hasId(roleId);
    if (isSystemRole) throw new Error('System roles cannot be removed');
    await this.userRepo.reassignUsersRole(
      roleId,
      this.systemRole.getCustomerRoleId(),
    );
    await this.acsyncSerivce.removeRole(roleId);
    await this.roleRepo.removeById(roleId);
  }
}
