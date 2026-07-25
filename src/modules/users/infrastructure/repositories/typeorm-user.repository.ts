import { Injectable } from '@nestjs/common';
import {
  FindAllUsersParams,
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
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findAll(
    params: FindAllUsersParams,
  ): Promise<DBResult<{ users: User[]; total: number }>> {
    return this.findBy({
      requesterRoleId: params.requesterRoleId,
      page: params.page,
      limit: params.limit,
    });
  }

  async findById(data: {
    requesterRoleId: string;
    userId: string;
  }): Promise<DBResult<User>> {
    try {
      const qb = this.createFindUsersQuery(data.requesterRoleId);

      qb.andWhere('user.id = :userId', { userId: data.userId });

      const row = await qb.getOne();

      if (!row) {
        throw new RecordNotFoundError(`user was not found: ${data.userId}`);
      }

      return Ok(this.toDomain(row));
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
  async assignUserRole(d: {
    requesterRoleId: string;
    targetUserId: string;
    targetRoleId: string;
  }) {
    try {
      const oldUserRoleIdCTE = this.userRepo
        .createQueryBuilder('user')
        .select('user.role_id', 'id')
        .where('user.id= :targetUserId', { targetUserId: d.targetUserId });
      const targetUserPermissons = this.userRepo.manager
        .createQueryBuilder(RoleEntity, 'role')
        .select('role.permissions', 'old_permissions')
        .where('role.id= (select id from old_user_role_id)');
      const targetRolePermissions = this.userRepo.manager
        .createQueryBuilder(RoleEntity, 'role')
        .select('role.permissions', 'target_permissions')
        .where('role.id=:targetRoleId', { targetRoleId: d.targetRoleId });
      const requesterRoleAssignScope = this.userRepo.manager
        .createQueryBuilder(RoleEntity, 'role')
        .select('role.assign_scope', 'assign_scope')
        .where('role.id=:requesterRoleId', {
          requesterRoleId: d.requesterRoleId,
        });
      const updateResult = await this.userRepo
        .createQueryBuilder('user')
        .addCommonTableExpression(oldUserRoleIdCTE, 'old_user_role_id')
        .addCommonTableExpression(targetUserPermissons, 'old_role_permissions')
        .addCommonTableExpression(
          targetRolePermissions,
          'target_role_permissions',
        )
        .addCommonTableExpression(
          requesterRoleAssignScope,
          'requester_assign_scope',
        )
        .update(UserEntity)
        .set({ roleId: d.targetRoleId })
        .where(
          `COALESCE((select assign_scope from requester_assign_scope),'[]'::jsonb) @> (select old_permissions from old_role_permissions)`,
        )
        .andWhere(
          `COALESCE((select assign_scope from requester_assign_scope),'[]'::jsonb) @> (select target_permissions from target_role_permissions)`,
        )
        .returning('*')
        .execute();
      const [row] = updateResult.raw as UserEntity[];
      return Ok(this.toDomain(row));
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

      return Ok({
        users: rows.map((row) => this.toDomain(row)),
        total,
      });
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }

  private createFindUsersQuery(
    requesterRoleId: string,
  ): SelectQueryBuilder<UserEntity> {
    const qb = this.userRepo.createQueryBuilder('user');

    this.applyAllowedRolesScope(qb, requesterRoleId);

    return qb;
  }

  private applyAllowedRolesScope(
    qb: SelectQueryBuilder<UserEntity>,
    requesterRoleId: string,
  ): void {
    // bring assign_scope of user requester.
    const requesterScopeCte = this.userRepo.manager
      .createQueryBuilder(RoleEntity, 'requester_role')
      .select('requester_role.assign_scope', 'assign_scope')
      .where('requester_role.id = :requesterRoleId', { requesterRoleId });
    // register userRequester.role.assign_scope as CTE
    qb.addCommonTableExpression(requesterScopeCte, 'requester_scope');
    // fire a sub-query to find all roles that are subset or equal to userRequester.role.assign_scope.
    qb.andWhere((subQb) => {
      const allowedRolesSubQuery = subQb
        .subQuery()
        .select('candidate_role.id')
        .from(RoleEntity, 'candidate_role')
        .where(
          `
            candidate_role.permissions <@ COALESCE(
              (SELECT assign_scope FROM requester_scope),
              '[]'::jsonb
            )`,
        )
        .getQuery();
      // here return a query for fetching all users that their roles fall in this list of role Id's
      return `user.role_id IN ${allowedRolesSubQuery}`;
    });
  }

  private applyRoleFilter(
    qb: SelectQueryBuilder<UserEntity>,
    filters: NormalizedUserFilters,
  ): void {
    if (!filters.roleId) return;

    qb.andWhere('role.id = :filterRoleId', {
      filterRoleId: filters.roleId,
    });
  }

  private applyEmailFilter(
    qb: SelectQueryBuilder<UserEntity>,
    filters: NormalizedUserFilters,
  ): void {
    if (!filters.email) return;

    qb.andWhere(`user.email ILIKE :email ESCAPE '\\'`, {
      email: this.toContainsPattern(filters.email),
    });
  }

  private applyPhoneFilter(
    qb: SelectQueryBuilder<UserEntity>,
    filters: NormalizedUserFilters,
  ): void {
    if (!filters.phone) return;

    qb.andWhere(`user.phone ILIKE :phone ESCAPE '\\'`, {
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
          .where(`user.name ILIKE :name ESCAPE '\\'`, { name: namePattern })
          .orWhere(`user.givenName ILIKE :name ESCAPE '\\'`, {
            name: namePattern,
          })
          .orWhere(`user.familyName ILIKE :name ESCAPE '\\'`, {
            name: namePattern,
          });
      }),
    );
  }

  private applySorting(qb: SelectQueryBuilder<UserEntity>): void {
    qb.orderBy('user.createdAt', 'DESC');
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
