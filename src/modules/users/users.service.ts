import { Injectable } from '@nestjs/common';
import { IUserRepository } from './infrastructure/repositories/user.repository';
import { FindUsersByParamsDto } from './dto/find-users-by-filter.dto';

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: IUserRepository) {}
  async findAll(d: { requesterRoleId: string; page?: number; limit?: number }) {
    const result = (await this.userRepo.findAll(d)).unwrap();
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
}
