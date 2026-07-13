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

@UseGuards(AccessGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly service: AccessControlService) {}

  @Post()
  @RequirePermission(AllPermissions.role.RoleCreateOwn)
  async create(@Body() dto: CreateRoleDto) {
    return this.service.upsertRole(dto);
  }

  @Get()
  @RequirePermission(AllPermissions.role.RoleReadOwn)
  async findAll(): Promise<RoleResponseDto[]> {
    return await this.service.loadAll();
  }

  @Put(':id')
  @RequirePermission(AllPermissions.role.RoleUpdateOwn)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return await this.service.updateRole(id, dto);
  }

  @Delete(':id')
  @RequirePermission(AllPermissions.role.RoleDeleteOwn)
  async remove(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string) {
    return this.service.removeRole(id);
  }
}
