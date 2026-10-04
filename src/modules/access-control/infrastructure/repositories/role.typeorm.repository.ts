import { Injectable } from '@nestjs/common';
import { IRoleRepository } from './role.repository';
import { Role } from '../../domain/role';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from '../entities/role.entity';
import { Brackets, In, Repository } from 'typeorm';
import type { DBResult } from 'src/modules/shared/errors/error.types';
import { Result } from '@allawiii/results-ts';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { RecordNotFoundError, UnknownDatabaseError } from 'src/modules/shared/errors/database.error';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import { RoleMapper } from '../mappers/role.mapper';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
  ) {}
  create(role: Role, creatorRoleId: string): DBResult<Role> {
    return Result.wrapAsync(async () => {
      const newRole = role.toJSON();
      const creatorRoleCte = this.roleRepo
        .createQueryBuilder('creator_role')
        .select('1', 'allowed')
        .where('creator_role.id = :creatorRoleId')
        .andWhere('creator_role.createScope @> :permissions::jsonb');

      const result = await this.roleRepo
        .createQueryBuilder()
        .addCommonTableExpression(creatorRoleCte, 'authorized_creator')
        .insert()
        .into(RoleEntity, ['id', 'name', 'permissions', 'createScope', 'assignScope'])
        .valuesFromSelect((qb) =>
          qb
            .select([':id', ':name', ':permissions::jsonb', ':createScope::jsonb', ':assignScope::jsonb'])
            .from('authorized_creator', 'creator'),
        )
        .setParameters({
          id: newRole.id,
          name: newRole.name,
          permissions: JSON.stringify(newRole.permissions),
          assignScope: newRole.assignScope ? JSON.stringify(newRole.assignScope) : null,
          createScope: newRole.createScope ? JSON.stringify(newRole.createScope) : null,
          creatorRoleId,
        })
        .returning('*')
        .execute();

      const [row] = result.raw as RoleEntity[];
      if (!row) throw new UnknownDatabaseError('Creator createScope does not contain new role permissions.');

      return row;
    })
      .andThen((r) => RoleMapper.toDomain(r))
      .mapErr(mapTypeOrmError);
  }
  loadManageableRoles(roleId: string): DBResult<Role[]> {
    return Result.wrapAsync(async () => {
      const loadPerms = this.roleRepo
        .createQueryBuilder('r')
        .select(['r.createScope AS createScope', 'r.assignScope AS assignScope'])
        .where('r.id = :id', { id: roleId });

      const loadRoles = await this.roleRepo
        .createQueryBuilder('role')
        .addCommonTableExpression(loadPerms, 'role_perms')
        .where(
          new Brackets((qb) => {
            qb.where(`COALESCE((SELECT createScope FROM role_perms), '[]'::jsonb) @> role.permissions`).orWhere(
              `COALESCE((SELECT assignScope FROM role_perms), '[]'::jsonb) @> role.permissions`,
            );
          }),
        )
        .getMany();

      return loadRoles;
    })
      .andThen((r) => RoleMapper.toDomainList(r))
      .mapErr(mapTypeOrmError);
  }
  loadAssignableRoles(roleId: string): DBResult<Role[]> {
    return Result.wrapAsync(async () => {
      const loadPerms = this.roleRepo
        .createQueryBuilder('r')
        .select('r.assignScope', 'assignScope')
        .where('r.id = :id', { id: roleId });

      const loadRoles = await this.roleRepo
        .createQueryBuilder('role')
        .addCommonTableExpression(loadPerms, 'role_perms')
        .where('(SELECT "assignScope" FROM role_perms) IS NOT NULL')
        .andWhere(`(SELECT "assignScope" FROM role_perms) @> role.permissions`)
        .getMany();
      return loadRoles;
    })
      .andThen((r) => RoleMapper.toDomainList(r))
      .mapErr(mapTypeOrmError);
  }
  loadCreatableRoles(roleId: string): DBResult<Role[]> {
    return Result.wrapAsync(async () => {
      const loadPerms = this.roleRepo
        .createQueryBuilder('r')
        .select('r.createScope', 'createScope')
        .where('r.id = :id', { id: roleId });

      const loadRoles = await this.roleRepo
        .createQueryBuilder('role')
        .addCommonTableExpression(loadPerms, 'role_perms')
        .where('(SELECT "createScope" FROM role_perms) IS NOT NULL')
        .andWhere(`(SELECT "createScope" FROM role_perms) @> role.permissions`)
        .getMany();
      return loadRoles;
    })
      .andThen((r) => RoleMapper.toDomainList(r))
      .mapErr(mapTypeOrmError);
  }
  loadByNames(names: string[]): DBResult<Role[]> {
    return Result.wrapAsync(async () => {
      if (names.length === 0) return [];
      return this.roleRepo.findBy({
        name: In(names),
      });
    })
      .andThen((r) => RoleMapper.toDomainList(r))
      .mapErr(mapTypeOrmError);
  }
  findById(id: string): DBResult<Role> {
    return Result.wrapAsync(async () => this.roleRepo.findOneByOrFail({ id }))
      .andThen((r) => RoleMapper.toDomain(r))
      .mapErr(mapTypeOrmError);
  }
  findByName(name: string): DBResult<Role> {
    return Result.wrapAsync(async () => this.roleRepo.findOneByOrFail({ name }))
      .andThen((r) => RoleMapper.toDomain(r))
      .mapErr(mapTypeOrmError);
  }
  loadAll(): DBResult<Role[]> {
    return Result.wrapAsync(async () => this.roleRepo.find())
      .andThen((r) => RoleMapper.toDomainList(r))
      .mapErr(mapTypeOrmError);
  }

  rename(data: { userRoleId: string; role: Role }): DBResult<Role> {
    return Result.wrapAsync(async () => {
      const requesterScope = this.roleRepo
        .createQueryBuilder('r')
        .select('r.createScope', 'createScope')
        .where('r.id = :requesterId', { requesterId: data.userRoleId });

      const result = await this.roleRepo
        .createQueryBuilder()
        .addCommonTableExpression(requesterScope, 'requester_scope')
        .update(RoleEntity)
        .set({ name: data.role.name })
        .where('id = :targetId', { targetId: data.role.id })
        .andWhere(
          `COALESCE((select createScope from requester_scope), '[]'::jsonb)
             @> (select permissions from roles where id = :targetId)`,
        )
        .returning('*')
        .execute();

      const [row] = result.raw as RoleEntity[];
      if (result.affected === 0 || !row)
        throw new RecordNotFoundError(`role to be updated was not found: ${data.role.id}`);
      return row;
    })
      .andThen((r) => RoleMapper.toDomain(r))
      .mapErr(mapTypeOrmError);
  }
  upsert(role: Role): DBResult<Role> {
    return Result.wrapAsync(async () => {
      const result = await this.roleRepo
        .createQueryBuilder()
        .insert()
        .into(RoleEntity)
        .values({
          ...role.toJSON(),
        })
        .orUpdate(['permissions', 'assignScope', 'createScope'], ['name'])
        .returning('*')
        .execute();
      const [row] = result.raw as RoleEntity[];
      if (!row) throw new UnknownDatabaseError('Upsert did not return a row');

      return row;
    })
      .andThen((r) => RoleMapper.toDomain(r))
      .mapErr(mapTypeOrmError);
  }
  deleteById(ids: { requesterRoleId: string; targetRoleId: string; defaultRoleId: string }): DBResult<number> {
    return Result.wrapAsync(async () => {
      const requesterCreateScopeCte = this.roleRepo
        .createQueryBuilder('requester')
        .select('requester.createScope', 'createScope')
        .where('requester.id = :requesterRoleId', {
          requesterRoleId: ids.requesterRoleId,
        });

      const deletableTargetCte = this.roleRepo
        .createQueryBuilder('target')
        .select('target.id', 'id')
        .where('target.id = :targetRoleId', { targetRoleId: ids.targetRoleId })
        .andWhere('target.permissions <@ (SELECT createScope FROM requester_scope)');

      const reassignedUsersCte = this.roleRepo.manager
        .createQueryBuilder()
        .update(UserEntity)
        .set({ roleId: ids.defaultRoleId })
        .where('"roleId" IN (SELECT id FROM deletable_target)')
        .returning('id');

      const result = await this.roleRepo
        .createQueryBuilder()
        .addCommonTableExpression(requesterCreateScopeCte, 'requester_scope')
        .addCommonTableExpression(deletableTargetCte, 'deletable_target')
        .addCommonTableExpression(reassignedUsersCte, 'reassigned_users')
        .delete()
        .from(RoleEntity)
        .where('id IN (SELECT id FROM deletable_target)')
        .andWhere('(SELECT COUNT(*) FROM reassigned_users) >= 0')
        .execute();
      return result.affected ?? 0;
    }).mapErr(mapTypeOrmError);
  }
}
