import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { AccessGuard } from './guards/access-control.guard';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { AllPermissions } from './domain/permission';
import { Session } from '@thallesp/nestjs-better-auth';
import { type AppSession } from 'src/auth/auth.config';

@UseGuards(AccessGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly service: AccessControlService) {}

  @Post()
  @RequirePermission(AllPermissions.role.RoleCreateOwn)
  async create(@Session() session: AppSession, @Body() dto: CreateRoleDto) {
    return this.service.upsertRole(session.user.roleId, dto);
  }

  @Get()
  @RequirePermission(AllPermissions.role.RoleReadOwn)
  async findAll(@Session() session: AppSession): Promise<RoleResponseDto[]> {
    return await this.service.loadAll(session.user.roleId);
  }

  @Put(':id')
  @RequirePermission(AllPermissions.role.RoleUpdateOwn)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Session() session: AppSession,
    @Body() dto: UpdateRoleDto,
  ) {
    return await this.service.updateRole(session.user.roleId, id, dto);
  }

  @Delete(':id')
  @RequirePermission(AllPermissions.role.RoleDeleteOwn)
  async remove(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string) {
    return this.service.removeRole(id);
  }
}
