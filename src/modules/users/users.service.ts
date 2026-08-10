import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from './infrastructure/repositories/user.repository';
import { FindUsersFlatQueryDto } from './dto/find-users-by-filter.dto';
import { ReassignUsersRoleDto } from './dto/reassign-users-role.dto';
import { UpdateMeDto } from './dto/update-user.dto';
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
    const user = (await this.userRepo.findMe(id)).unwrapOrThrow();
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
    ).unwrapOrThrow();
    return { users: users.users.map((u) => u.toJSON()), total: users.total };
  }
  async findById(
    requesterRoleId: string,
    userId: string,
  ): Promise<UserResponseDto> {
    const user = (
      await this.userRepo.findById({ requesterRoleId, userId })
    ).unwrapOrThrow();
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
    return user.unwrapOrThrow();
  }
  async assignRoleToUsers(
    requesterRoleId: string,
    d: ReassignUsersRoleDto,
  ): Promise<number> {
    const result = await this.userRepo.assignUsersRole({
      ...d,
      requesterRoleId,
    });
    return result.unwrapOrThrow();
  }
  async updateUser(id: string, d: UpdateMeDto): Promise<UserResponseDto> {
    const user = (await this.userRepo.updateById(id, d))
      .map((u) => u.toResult(new NotFoundException(`User ${id} not found`)))
      .unwrapOrThrow()
      .unwrapOrThrow();
    return user.toJSON();
  }
}
