import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { type AppSession } from 'src/auth/auth.config';
import { Session } from '@thallesp/nestjs-better-auth';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { AllPermissions } from '../access-control/domain/permission';
import { FindUsersResponseDto } from './dto/find-users-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { FindUsersFlatQueryDto } from './dto/find-users-by-filter.dto';
import { UpdateMeDto } from './dto/update-user.dto';
import { AssignRoleToUserDto } from './dto/assign-role-to-user.dto';
import { ReassignUsersRoleDto } from './dto/reassign-users-role.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileInfoDto } from '../shared/dto/upload-file-info.dto';
import { fileFilter } from '../shared/utils/file-filter.util';
import { ImageResponseDto } from '../shared/dto/image-response.dto';
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}
  @Get('me')
  async findMe(@Session() session: AppSession): Promise<UserResponseDto> {
    const me = await this.service.findMe(session.user.id);
    return me;
  }
  @Get()
  @RequirePermission(AllPermissions.user.UserReadLessOrEqual)
  async findAll(@Session() session: AppSession, @Query() dto: FindUsersFlatQueryDto): Promise<FindUsersResponseDto> {
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
  @Patch('me')
  async updateMe(@Session() session: AppSession, @Body() body: UpdateMeDto) {
    return this.service.updateUser(session.user.id, body);
  }
  @Patch(':id/role')
  @RequirePermission(AllPermissions.role.RoleAssignLessOrEqual)
  async assignRole(
    @Session() session: AppSession,
    @Param('id', new ParseUUIDPipe({ version: '7' })) targetUserId: string,
    @Body() body: AssignRoleToUserDto,
  ): Promise<UserResponseDto> {
    return this.service.assignRoleToUser(session.user.roleId, targetUserId, body.roleId);
  }
  @Patch('roles/reassign')
  @RequirePermission(AllPermissions.role.RoleAssignLessOrEqual)
  async reassignUsersRole(
    @Session() session: AppSession,
    @Body() dto: ReassignUsersRoleDto,
  ): Promise<{ affected: number }> {
    return {
      affected: await this.service.assignRoleToUsers(session.user.roleId, dto),
    };
  }
  @Put(':id/profile-image')
  @RequirePermission(AllPermissions.images.ImagesUploadOwn)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: fileFilter,
    }),
  )
  updateProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() fileInfo: UploadFileInfoDto,
    @Session() session: AppSession,
  ): Promise<ImageResponseDto> {
    return this.service.setProfileImage(file, session.user.id, fileInfo);
  }
}
