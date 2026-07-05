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
  async updateById(id: string, data: UpdateUserRepoData): Promise<User | null> {
    const result = await this.userRepo
      .createQueryBuilder()
      .update(UserEntity)
      .set({ ...data })
      .where('id= :id', { id })
      .returning('*')
      .execute();
    const rows = result.raw as UserEntity[];
    const row = rows[0] ?? null;
    return row ? this.toDomain(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.userRepo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  private toDomain(userEntity: UserEntity): User {
    return User.fromPrimitives({
      id: userEntity.id,
      email: userEntity.email,
      name: userEntity.name,
      givenName: userEntity.givenName,
      familyName: userEntity.familyName,
      roleId: userEntity.roleId,
      phone: userEntity.phone ?? undefined,
      updatedAt: userEntity.updatedAt,
      createdAt: userEntity.createdAt,
    });
  }
}
