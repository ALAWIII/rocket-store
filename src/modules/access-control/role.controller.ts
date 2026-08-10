import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { AllPermissions } from './domain/permission';
import { Session } from '@thallesp/nestjs-better-auth';
import { type AppSession } from 'src/auth/auth.config';
import { FindRolesQueryDto } from './dto/find-roles.query.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly service: RoleService) {}

  @Post('policies/reload')
  @HttpCode(200)
  @RequirePermission(AllPermissions.role.RoleReloadAll)
  async reloadPolicies() {
    return { attempt: await this.service.reloadPolicies() };
  }
  @Post()
  @RequirePermission(AllPermissions.role.RoleCreateLessOrEqual)
  async create(@Session() session: AppSession, @Body() dto: CreateRoleDto) {
    return await this.service.createRole(session.user.roleId, dto);
  }

  @Get()
  @RequirePermission(AllPermissions.role.RoleReadLessOrEqual)
  async findAll(
    @Session() session: AppSession,
    @Query() query: FindRolesQueryDto,
  ): Promise<RoleResponseDto[]> {
    if (query.scope === 'assignable') {
      return this.service.findAssignableRoles(session.user.roleId);
    }

    if (query.scope === 'creatable') {
      return this.service.findCreatedRoles(session.user.roleId);
    }

    return this.service.findAll(session.user.roleId);
  }
  @Put(':id')
  @RequirePermission(AllPermissions.role.RoleRenameLessOrEqual)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Session() session: AppSession,
    @Body() dto: UpdateRoleDto,
  ) {
    return await this.service.renameRole(session.user.roleId, id, dto);
  }

  @Delete(':id')
  @RequirePermission(AllPermissions.role.RoleDeleteLess)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Session() session: AppSession,
  ): Promise<{ affected: number }> {
    return { affected: await this.service.removeRole(session.user.roleId, id) };
  }
}
