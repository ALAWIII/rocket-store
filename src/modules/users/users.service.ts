import { Injectable } from '@nestjs/common';
import { IUserRepository } from './infrastructure/repositories/user.repository';
import { FindUsersByParamsDto } from './dto/find-users-by-filter.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { AssignRoleToUserDto } from './dto/assign-role-to-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: IUserRepository) {}
  async findAll(requesterRoleId: string, d: FindAllUsersDto) {
    const result = (
      await this.userRepo.findAll({ ...d, requesterRoleId })
    ).unwrap();
    return { users: result.users.map((u) => u.toJSON()), total: result.total };
  }
  async findUser(id: string) {
    const user = (await this.userRepo.findUserRequester(id)).unwrap();
    return user.toJSON();
  }
  async findBy(requesterRoleId: string, filters: FindUsersByParamsDto) {
    const users = (
      await this.userRepo.findBy({
        ...filters,
        requesterRoleId,
      })
    ).unwrap();
    return { users: users.users.map((u) => u.toJSON()), total: users.total };
  }
  async findById(requesterRoleId: string, userId: string) {
    const user = (
      await this.userRepo.findById({ requesterRoleId, userId })
    ).unwrap();
    return user.toJSON();
  }
  async assignRoleToUser(requesterRoleId: string, d: AssignRoleToUserDto) {
    const user = (
      await this.userRepo.assignUserRole({ ...d, requesterRoleId })
    ).map((u) => u.toJSON());
    return user.unwrap();
  }
}
