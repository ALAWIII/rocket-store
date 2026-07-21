import { Injectable } from '@nestjs/common';
import { IUserRepository } from './infrastructure/repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: IUserRepository) {}
  findAll() {}
}
