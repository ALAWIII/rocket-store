import { Injectable } from '@nestjs/common';
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

  findMe(id: string): Promise<UserResponseDto> {
    return this.userRepo
      .findMe(id)
      .map((v) => v.toJSON())
      .unwrap();
  }
  findBy(
    requesterRoleId: string,
    filters: FindUsersByQueryDto,
  ): Promise<FindUsersResponseDto> {
    return this.userRepo
      .findBy({
        ...filters,
        requesterRoleId,
      })
      .map(({ users, total }) => {
        return { users: users.map((u) => u.toJSON()), total };
      })
      .unwrap();
  }
  findById(requesterRoleId: string, userId: string): Promise<UserResponseDto> {
    return this.userRepo
      .findById({ requesterRoleId, userId })
      .map((v) => v.toJSON())
      .unwrap();
  }
  assignRoleToUser(
    requesterRoleId: string,
    targetUserId: string,
    targetRoleId: string,
  ): Promise<UserResponseDto> {
    return this.userRepo
      .assignUserRole({
        targetRoleId,
        requesterRoleId,
        targetUserId,
      })
      .map((u) => u.toJSON())
      .unwrap();
  }
  assignRoleToUsers(
    requesterRoleId: string,
    d: ReassignUsersRoleDto,
  ): Promise<number> {
    return this.userRepo
      .assignUsersRole({
        ...d,
        requesterRoleId,
      })
      .unwrap();
  }
  updateUser(id: string, d: UpdateMeDto): Promise<UserResponseDto> {
    return this.userRepo
      .updateById(id, d)
      .map((u) => u.toJSON())
      .unwrap();
  }
}
