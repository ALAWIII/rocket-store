import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly service: AccessControlService) {}

  @Post()
  async create(@Body() dto: CreateRoleDto) {
    return this.service.upsertRole(dto);
  }

  @Get()
  async findAll(): Promise<RoleResponseDto[]> {
    return await this.service.loadAll();
  }

  @Put(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return await this.service.updateRole(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string) {
    return this.service.removeRole(id);
  }
}
