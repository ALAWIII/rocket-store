import { Injectable } from '@nestjs/common';
import { UserRepository } from './infrastructure/repositories/typeorm-user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: UserRepository) {}
  findAll() {}
}
