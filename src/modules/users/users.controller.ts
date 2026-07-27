import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AccessGuard } from '../access-control/guards/access-control.guard';
import { type AppSession } from 'src/auth/auth.config';
import { Session } from '@thallesp/nestjs-better-auth';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { AllPermissions } from '../access-control/domain/permission';
import { FindUsersResponseDto } from './dto/find-users-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { FindUsersFlatQueryDto } from './dto/find-users-by-filter.dto';

@UseGuards(AccessGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}
  @Get('me')
  @RequirePermission(AllPermissions.user.UserReadOwn)
  async findMe(@Session() session: AppSession): Promise<UserResponseDto> {
    const me = await this.service.findMe(session.user.id);
    return me;
  }
  @Get()
  @RequirePermission(AllPermissions.user.UserReadLessOrEqual)
  async findAll(
    @Session() session: AppSession,
    @Query() dto: FindUsersFlatQueryDto,
  ): Promise<FindUsersResponseDto> {
    const mappedDto = {
      page: dto.page,
      limit: dto.limit,
      filters: {
        name: dto.name,
        roleId: dto.roleId,
        phone: dto.phone,
        email: dto.email,
      },
    };
    const users = await this.service.findBy(session.user.roleId, mappedDto);
    return users;
  }
  @Get(':id')
  @RequirePermission(AllPermissions.user.UserReadLessOrEqual)
  async findById(
    @Session() session: AppSession,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<UserResponseDto> {
    const user = this.service.findById(session.user.roleId, id);
    return user;
  }
}
