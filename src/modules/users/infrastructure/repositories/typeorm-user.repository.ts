import { Injectable } from '@nestjs/common';
import { IUserRepository, UpdateUserRepoData } from './user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { User } from '../../domain/user';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}
  async save(user: User): Promise<User> {
    const entity = this.userRepo.create(user.toJSON());
    const saved = await this.userRepo.save(entity);
    const fullUser = await this.findById(saved.id);
    return fullUser!;
  }
  async updateByAuthId(
    authId: string,
    data: UpdateUserRepoData,
  ): Promise<User | null> {
    const result = await this.userRepo.update({ authId: authId }, data);
    if (!result.affected) {
      return null;
    }
    return this.findByAuthId(authId);
  }
  async findByAuthId(authId: string): Promise<User | null> {
    const entity = await this.userRepo.findOneBy({ authId });
    return entity ? this.toDomain(entity) : null;
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.userRepo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  private toDomain(userEntity: UserEntity): User {
    return User.fromPrimitives({
      id: userEntity.id,
      authId: userEntity.authId,
      email: userEntity.authUser.email,
      firstName: userEntity.firstName,
      lastName: userEntity.lastName,
      roleId: userEntity.roleId,
      phone: userEntity.phone,
      updatedAt: userEntity.updatedAt,
      createdAt: userEntity.authUser.createdAt,
    });
  }
}
