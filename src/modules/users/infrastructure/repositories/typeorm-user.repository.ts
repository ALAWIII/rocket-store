import { Injectable } from '@nestjs/common';
import {
  FindUsersByParams,
  IUserRepository,
  UpdateUserRepoData,
  UserFilters,
} from './user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { User } from '../../domain/user';
import {
  CorruptedPersistenceDataError,
  RecordNotFoundError,
  UnknownDatabaseError,
} from 'src/modules/shared/errors/database.error';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Err, None, Ok, Option, Some } from 'ts-results-es';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { RoleEntity } from 'src/modules/access-control/infrastructure/entities/role.entity';

type UsersFindResult = {
  users: User[];
  total: number;
};
type NormalizedUserFilters = {
  name?: string;
  email?: string;
  roleId?: string;
  phone?: string;
};

type Pagination = {
  page: number;
  limit: number;
  skip: number;
};
//============= aliases
const usr = 'usr';
//==================
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findMe(id: string): Promise<DBResult<User>> {
    try {
      const result = await this.userRepo.findOneBy({ id });
      if (!result) {
        return Err(new RecordNotFoundError(`user was not found: ${id}`));
      }
      return this.toDomain(result);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async findById(data: {
    requesterRoleId: string;
    userId: string;
  }): Promise<DBResult<User>> {
    try {
      const qb = this.createFindUsersQuery(data.requesterRoleId);

      qb.andWhere(`${usr}.id = :userId`, { userId: data.userId });

      const user = await qb.getOne();

      if (!user) {
        return Err(
          new RecordNotFoundError(`user was not found: ${data.userId}`),
        );
      }

      return this.toDomain(user);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async save(user: User): Promise<DBResult<User>> {
    try {
      const userJson = user.toJSON();
      const result = await this.userRepo
        .createQueryBuilder()
        .insert()
        .values({
          ...userJson,
          givenName: userJson.givenName ?? undefined,
          familyName: userJson.familyName ?? undefined,
        })
        .returning('*')
        .execute();

      const [row] = result.raw as UserEntity[];
      if (!row) {
        return Err(
          new UnknownDatabaseError('Failed to return the newly inserted user.'),
        );
      }
      return this.toDomain(row);
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
      const [user] = result.raw as UserEntity[];

      return user ? this.toDomain(user).map((r) => Some(r)) : Ok(None);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async assignUserRole(d: {
    requesterRoleId: string;
    targetUserId: string;
    targetRoleId: string;
  }): Promise<DBResult<User>> {
    try {
      const oldUserRoleIdCte = this.userRepo
        .createQueryBuilder('user')
        .select('user.roleId', 'id')
        .where('user.id = :targetUserId', {
          targetUserId: d.targetUserId,
        });

      const oldRolePermissionsCte = this.userRepo.manager
        .createQueryBuilder(RoleEntity, 'role')
        .select('role.permissions', 'permissions')
        .where('role.id = (select id from old_user_role_id)');

      const targetRolePermissionsCte = this.userRepo.manager
        .createQueryBuilder(RoleEntity, 'role')
        .select('role.permissions', 'permissions')
        .where('role.id = :targetRoleId', {
          targetRoleId: d.targetRoleId,
        });

      const requesterAssignScopeCte = this.userRepo.manager
        .createQueryBuilder(RoleEntity, 'role')
        .select('role.assignScope', 'assignScope')
        .where('role.id = :requesterRoleId', {
          requesterRoleId: d.requesterRoleId,
        });

      const result = await this.userRepo
        .createQueryBuilder()
        .addCommonTableExpression(oldUserRoleIdCte, 'old_user_role_id')
        .addCommonTableExpression(oldRolePermissionsCte, 'old_role_permissions')
        .addCommonTableExpression(
          targetRolePermissionsCte,
          'target_role_permissions',
        )
        .addCommonTableExpression(
          requesterAssignScopeCte,
          'requester_assign_scope',
        )
        .update(UserEntity)
        .set({ roleId: d.targetRoleId })
        .where('id = :targetUserId', {
          targetUserId: d.targetUserId,
        })
        .andWhere(
          `
          COALESCE(
            (select "assignScope" from requester_assign_scope),
            '[]'::jsonb
          ) @> (select permissions from old_role_permissions)
        `,
        )
        .andWhere(
          `
          COALESCE(
            (select "assignScope" from requester_assign_scope),
            '[]'::jsonb
          ) @> (select permissions from target_role_permissions)
        `,
        )
        .returning('*')
        .execute();

      const [user] = result.raw as UserEntity[];

      if (result.affected === 0 || !user) {
        return Err(
          new RecordNotFoundError(
            `user role could not be assigned: ${d.targetUserId}`,
          ),
        );
      }

      return this.toDomain(user);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async assignUsersRole(d: {
    requesterRoleId: string;
    oldRoleId: string;
    newRoleId: string;
  }): Promise<DBResult<number>> {
    try {
      const requesterScope = this.userRepo.manager
        .createQueryBuilder(RoleEntity, 'role')
        .select('role.assignScope', 'assignScope')
        .where('role.id = :requesterRoleId', {
          requesterRoleId: d.requesterRoleId,
        });

      const oldPermissions = this.userRepo.manager
        .createQueryBuilder(RoleEntity, 'role')
        .select('role.permissions', 'permissions')
        .where('role.id = :oldRoleId', { oldRoleId: d.oldRoleId });

      const newPermissions = this.userRepo.manager
        .createQueryBuilder(RoleEntity, 'role')
        .select('role.permissions', 'permissions')
        .where('role.id = :newRoleId', { newRoleId: d.newRoleId });

      const updateResult = await this.userRepo
        .createQueryBuilder()
        .addCommonTableExpression(requesterScope, 'req_assign_scope')
        .addCommonTableExpression(oldPermissions, 'old_role_permissions')
        .addCommonTableExpression(newPermissions, 'new_role_permissions')
        .update(UserEntity)
        .set({ roleId: d.newRoleId })
        .where('roleId = :oldRoleId', { oldRoleId: d.oldRoleId })
        .andWhere(
          `
           COALESCE(
             (select "assignScope" from req_assign_scope),
             '[]'::jsonb
           ) @> (select permissions from old_role_permissions)
         `,
        )
        .andWhere(
          `
           COALESCE(
             (select "assignScope" from req_assign_scope),
             '[]'::jsonb
           ) @> (select permissions from new_role_permissions)
         `,
        )
        .execute();
      return Ok(updateResult.affected ?? 0);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async findBy(params: FindUsersByParams): Promise<DBResult<UsersFindResult>> {
    try {
      const pagination = this.normalizePagination(params.page, params.limit);
      const filters = this.normalizeUserFilters(params.filters);

      const qb = this.createFindUsersQuery(params.requesterRoleId);

      this.applyRoleFilter(qb, filters);
      this.applyEmailFilter(qb, filters);
      this.applyPhoneFilter(qb, filters);
      this.applyNameFilter(qb, filters);
      this.applySorting(qb);
      this.applyPagination(qb, pagination);

      const [rows, total] = await qb.getManyAndCount();
      const users: User[] = [];
      for (const row of rows) {
        const result = this.toDomain(row);
        if (result.isErr()) return result;
        users.push(result.unwrap());
      }
      return Ok({ users, total });
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }

  private createFindUsersQuery(
    requesterRoleId: string,
  ): SelectQueryBuilder<UserEntity> {
    const qb = this.userRepo.createQueryBuilder(usr);

    this.applyAllowedRolesScope(qb, requesterRoleId);

    return qb;
  }

  private applyAllowedRolesScope(
    qb: SelectQueryBuilder<UserEntity>,
    requesterRoleId: string,
  ): void {
    // bring assignScope of user requester.
    const requesterScopeCte = this.userRepo.manager
      .createQueryBuilder(RoleEntity, 'requester_role')
      .select('requester_role.permissions', 'permissions')
      .where('requester_role.id = :requesterRoleId', { requesterRoleId });
    // register userRequester.role.assignScope as CTE
    qb.addCommonTableExpression(requesterScopeCte, 'requester_scope');
    // fire a sub-query to find all roles that are subset or equal to userRequester.role.permissions.
    qb.andWhere((subQb) => {
      const allowedRolesSubQuery = subQb
        .subQuery()
        .select('candidate_role.id')
        .from(RoleEntity, 'candidate_role')
        .where(
          `(SELECT permissions FROM requester_scope) @> candidate_role.permissions`,
        )
        .getQuery();
      // here return a query for fetching all users that their roles fall in this list of role Id's
      return `${usr}."roleId" IN ${allowedRolesSubQuery}`;
    });
  }

  private applyRoleFilter(
    qb: SelectQueryBuilder<UserEntity>,
    filters: NormalizedUserFilters,
  ): void {
    if (!filters.roleId) return;

    qb.andWhere(`${usr}."roleId" = :filterRoleId`, {
      filterRoleId: filters.roleId,
    });
  }

  private applyEmailFilter(
    qb: SelectQueryBuilder<UserEntity>,
    filters: NormalizedUserFilters,
  ): void {
    if (!filters.email) return;

    qb.andWhere(`${usr}.email ILIKE :email ESCAPE '\\'`, {
      email: this.toContainsPattern(filters.email),
    });
  }

  private applyPhoneFilter(
    qb: SelectQueryBuilder<UserEntity>,
    filters: NormalizedUserFilters,
  ): void {
    if (!filters.phone) return;

    qb.andWhere(`${usr}.phone ILIKE :phone ESCAPE '\\'`, {
      phone: this.toContainsPattern(filters.phone),
    });
  }

  private applyNameFilter(
    qb: SelectQueryBuilder<UserEntity>,
    filters: NormalizedUserFilters,
  ): void {
    if (!filters.name) return;

    const namePattern = this.toContainsPattern(filters.name);

    qb.andWhere(
      new Brackets((nameQb) => {
        nameQb
          .where(`${usr}.name ILIKE :name ESCAPE '\\'`, { name: namePattern })
          .orWhere(`${usr}."givenName" ILIKE :name ESCAPE '\\'`, {
            name: namePattern,
          })
          .orWhere(`${usr}."familyName" ILIKE :name ESCAPE '\\'`, {
            name: namePattern,
          });
      }),
    );
  }

  private applySorting(qb: SelectQueryBuilder<UserEntity>): void {
    qb.orderBy(`${usr}."createdAt"`, 'DESC');
  }

  private applyPagination(
    qb: SelectQueryBuilder<UserEntity>,
    pagination: Pagination,
  ): void {
    qb.skip(pagination.skip).take(pagination.limit);
  }

  private normalizePagination(page?: number, limit?: number): Pagination {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.max(1, Math.min(100, limit ?? 20));

    return {
      page: safePage,
      limit: safeLimit,
      skip: (safePage - 1) * safeLimit,
    };
  }

  private normalizeUserFilters(filters?: UserFilters): NormalizedUserFilters {
    return {
      name: this.normalizeOptionalString(filters?.name),
      email: this.normalizeOptionalString(filters?.email),
      roleId: this.normalizeOptionalString(filters?.roleId),
      phone: this.normalizeOptionalString(filters?.phone),
    };
  }

  private normalizeOptionalString(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private toContainsPattern(value: string): string {
    return `%${this.escapeLikePattern(value)}%`;
  }

  private escapeLikePattern(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }
  private toDomain(userEntity: UserEntity): DBResult<User> {
    const mappedUser = User.fromPrimitives({
      id: userEntity.id,
      email: userEntity.email,
      name: userEntity.name,
      givenName: userEntity.givenName,
      familyName: userEntity.familyName,
      image: userEntity.image ?? undefined,
      roleId: userEntity.roleId,
      phone: userEntity.phone ?? undefined,
      updatedAt: userEntity.updatedAt,
      createdAt: userEntity.createdAt,
    }).mapErr(
      (e) =>
        new CorruptedPersistenceDataError(
          `Failed to construct User from UserEntity: ${e.message}`,
          e,
        ),
    );

    return mappedUser;
  }
}
