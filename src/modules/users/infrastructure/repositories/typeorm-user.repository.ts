import { Injectable } from '@nestjs/common';
import {
  FilterUsersByData,
  IUserRepository,
  UpdateUserRepoData,
} from './user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { User } from '../../domain/user';
import {
  CorruptedPersistenceDataError,
  UnknownDatabaseError,
} from 'src/modules/shared/errors/database.error';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Err, None, Ok, Option, Some } from 'ts-results-es';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findAll(d: {
    page: number;
    limit: number;
  }): Promise<DBResult<{ users: User[]; total: number }>> {
    try {
      const [items, total] = await this.userRepo
        .createQueryBuilder()
        .orderBy('createdAt', 'DESC')
        .skip((d.page - 1) * d.limit)
        .take(d.limit)
        .getManyAndCount();

      return Ok({ users: items.map((u) => this.toDomain(u)), total });
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async findById(id: string): Promise<DBResult<Option<User>>> {
    try {
      const entity = await this.userRepo.findOneBy({ id });
      return Ok(entity ? Some(this.toDomain(entity)) : None);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async findBy(
    data: FilterUsersByData,
  ): Promise<DBResult<{ users: User[]; total: number }>> {
    try {
      const qb = this.userRepo.createQueryBuilder('users');

      if (data.name) {
        qb.andWhere(
          new Brackets((q) => {
            q.where('users.name ILIKE :name', { name: `%${data.name}%` })
              .orWhere('users.givenName ILIKE :name', {
                name: `%${data.name}%`,
              })
              .orWhere('users.familyName ILIKE :name', {
                name: `%${data.name}%`,
              });
          }),
        );
      }

      if (data.email)
        qb.andWhere('users.email ILIKE :email', { email: `%${data.email}%` });
      if (data.roleId)
        qb.andWhere('users.roleId = :roleId', { roleId: data.roleId });
      if (data.phone)
        qb.andWhere('users.phone ILIKE :phone', { phone: `%${data.phone}%` });

      const [users, total] = await qb
        .skip(((data.page ?? 1) - 1) * (data.limit ?? 100))
        .take(data.limit ?? 100)
        .getManyAndCount();
      return Ok({ users: users.map((u) => this.toDomain(u)), total });
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async save(user: User): Promise<DBResult<User>> {
    try {
      const result = await this.userRepo
        .createQueryBuilder()
        .insert()
        .values(user.toJSON())
        .returning('*')
        .execute();

      const row = (result.raw as UserEntity[])[0];
      if (!row) {
        throw new UnknownDatabaseError(
          'Failed to return the newly inserted user.',
        );
      }
      return Ok(this.toDomain(row));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async updateById(
    id: string,
    data: UpdateUserRepoData,
  ): Promise<DBResult<Option<User>>> {
    try {
      const result = await this.userRepo
        .createQueryBuilder()
        .update(UserEntity)
        .set({ ...data })
        .where('id= :id', { id })
        .returning('*')
        .execute();
      const rows = result.raw as UserEntity[];
      const row = rows[0] ?? null;

      return Ok(row ? Some(this.toDomain(row)) : None);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }

  async reassignUsersRole(
    oldRoleId: string,
    newRoleId: string,
  ): Promise<DBResult<number>> {
    try {
      const updateResult = await this.userRepo.update(
        { roleId: oldRoleId },
        { roleId: newRoleId },
      );
      return Ok(updateResult.affected ?? 0);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  private toDomain(userEntity: UserEntity): User {
    const mappedUser = User.fromPrimitives({
      id: userEntity.id,
      email: userEntity.email,
      name: userEntity.name,
      givenName: userEntity.givenName,
      familyName: userEntity.familyName,
      roleId: userEntity.roleId,
      phone: userEntity.phone ?? undefined,
      updatedAt: userEntity.updatedAt,
      createdAt: userEntity.createdAt,
    }).mapErr(
      (e) =>
        new CorruptedPersistenceDataError(
          `Failed to construct User from UserEntity`,
          e,
        ),
    );

    return mappedUser.unwrap();
  }
}
