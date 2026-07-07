import { Injectable } from '@nestjs/common';
import { IRoleRepository } from './infrastructure/repositories/role.repository';
import { AccessControlSyncService } from './application/access-control-sync.service';
import { Permission } from './domain/permission';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class AccessControlService {
  constructor(
    private readonly roleRepo: IRoleRepository,
    private readonly acsyncSerivce: AccessControlSyncService,
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
}
