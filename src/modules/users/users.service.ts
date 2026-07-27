import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from './infrastructure/repositories/user.repository';
import { FindUsersFlatQueryDto } from './dto/find-users-by-filter.dto';
import { AssignRoleToUsersDto } from './dto/assign-role-to-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { FindUsersResponseDto } from './dto/find-users-response.dto';

type Filters = Omit<FindUsersFlatQueryDto, 'limit' | 'page'>;
type FindUsersByQueryDto = Pick<FindUsersFlatQueryDto, 'page' | 'limit'> & {
  filters?: Filters;
};

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: IUserRepository) {}

  async findMe(id: string): Promise<UserResponseDto> {
    const user = (await this.userRepo.findMe(id)).unwrap();
    return user.toJSON();
  }
  async findBy(
    requesterRoleId: string,
    filters: FindUsersByQueryDto,
  ): Promise<FindUsersResponseDto> {
    const users = (
      await this.userRepo.findBy({
        ...filters,
        requesterRoleId,
      })
    ).unwrap();
    return { users: users.users.map((u) => u.toJSON()), total: users.total };
  }
  async findById(
    requesterRoleId: string,
    userId: string,
  ): Promise<UserResponseDto> {
    const user = (
      await this.userRepo.findById({ requesterRoleId, userId })
    ).unwrap();
    return user.toJSON();
  }
  async assignRoleToUser(
    requesterRoleId: string,
    targetUserId: string,
    targetRoleId: string,
  ): Promise<UserResponseDto> {
    const user = (
      await this.userRepo.assignUserRole({
        targetRoleId,
        requesterRoleId,
        targetUserId,
      })
    ).map((u) => u.toJSON());
    return user.unwrap();
  }
  async assignRoleToUsers(
    requesterRoleId: string,
    d: AssignRoleToUsersDto,
  ): Promise<number> {
    const result = await this.userRepo.assignUsersRole({
      ...d,
      requesterRoleId,
    });
    return result.unwrap();
  }
  async updateUser(id: string, d: UpdateUserDto): Promise<UserResponseDto> {
    const user = (await this.userRepo.updateById(id, d))
      .map((u) => u.toResult(new NotFoundException(`User ${id} not found`)))
      .unwrap()
      .unwrap();
    return user.toJSON();
  }
}
