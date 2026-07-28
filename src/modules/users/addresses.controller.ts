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
import { AccessGuard } from '../access-control/guards/access-control.guard';
import { AddressService } from './address.service';
import { Session } from '@thallesp/nestjs-better-auth';
import { type AppSession } from 'src/auth/auth.config';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { AllPermissions } from '../access-control/domain/permission';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('users/me/addresses')
export class MyAddressesController {
  constructor(private readonly service: AddressService) {}

  @Get()
  async findAll(@Session() session: AppSession) {
    return await this.service.findAll(session.user.id);
  }
  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Session() session: AppSession,
  ) {
    return this.service.findById(session.user.id, id);
  }
  @Post()
  async create(@Session() session: AppSession, @Body() d: CreateAddressDto) {
    return await this.service.createAdrs(session.user.id, d);
  }
  @Put(':id')
  async update(
    @Session() session: AppSession,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() d: UpdateAddressDto,
  ) {
    return await this.service.updateAdrs(session.user.id, id, d);
  }
  @Delete(':id')
  async delete(
    @Session() session: AppSession,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ) {
    return this.service.deleteAdrs(session.user.id, id);
  }
}

@UseGuards(AccessGuard)
@Controller('users/:userId/addresses')
export class UserAddressesController {
  constructor(private readonly service: AddressService) {}

  @Get(':id')
  @RequirePermission(AllPermissions.address.AddressReadLessOrEqual)
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Param('userId', new ParseUUIDPipe({ version: '7' })) userId: string,
  ) {
    return this.service.findById(userId, id);
  }
  @Get()
  @RequirePermission(AllPermissions.address.AddressReadLessOrEqual)
  async findAllForUser(
    @Param('userId', new ParseUUIDPipe({ version: '7' })) userId: string,
  ) {
    return await this.service.findAll(userId);
  }
}
