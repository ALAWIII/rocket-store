import { Injectable } from '@nestjs/common';
import { IRoleRepository } from './role.repository';
import { Role } from '../../domain/role';
import { Permission } from '../../domain/permission';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from '../entities/role.entity';
import { Brackets, In, Repository } from 'typeorm';
import type { DBResult } from 'src/modules/shared/errors/error.types';
import { Err, None, Ok, Option, Some } from 'ts-results-es';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import {
  CorruptedPersistenceDataError,
  RecordNotFoundError,
  UnknownDatabaseError,
} from 'src/modules/shared/errors/database.error';
import { PermissionError } from '../../domain/permission.error';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
  ) {}
  async create(role: Role, creatorRoleId: string): Promise<DBResult<Role>> {
    try {
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
        .into(RoleEntity, [
          'id',
          'name',
          'permissions',
          'createScope',
          'assignScope',
        ])
        .valuesFromSelect((qb) =>
          qb
            .select([
              ':id',
              ':name',
              ':permissions::jsonb',
              ':createScope::jsonb',
              ':assignScope::jsonb',
            ])
            .from('authorized_creator', 'creator'),
        )
        .setParameters({
          id: newRole.id,
          name: newRole.name,
          permissions: JSON.stringify(newRole.permissions),
          assignScope: newRole.assignScope
            ? JSON.stringify(newRole.assignScope)
            : null,
          createScope: newRole.createScope
            ? JSON.stringify(newRole.createScope)
            : null,
          creatorRoleId,
        })
        .returning('*')
        .execute();

      const [row] = result.raw as RoleEntity[];
      if (!row) {
        return Err(
          new UnknownDatabaseError(
            'Creator createScope does not contain new role permissions.',
          ),
        );
      }
      return this.toDomain(row);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async loadManageableRoles(roleId: string): Promise<DBResult<Role[]>> {
    try {
      const loadPerms = this.roleRepo
        .createQueryBuilder('r')
        .select([
          'r.createScope AS createScope',
          'r.assignScope AS assignScope',
        ])
        .where('r.id = :id', { id: roleId });

      const loadRoles = await this.roleRepo
        .createQueryBuilder('role')
        .addCommonTableExpression(loadPerms, 'role_perms')
        .where(
          new Brackets((qb) => {
            qb.where(
              `COALESCE((SELECT createScope FROM role_perms), '[]'::jsonb) @> role.permissions`,
            ).orWhere(
              `COALESCE((SELECT assignScope FROM role_perms), '[]'::jsonb) @> role.permissions`,
            );
          }),
        )
        .getMany();

      return this.mapRolesToDomain(loadRoles);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async loadAssignableRoles(roleId: string): Promise<DBResult<Role[]>> {
    try {
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

      return this.mapRolesToDomain(loadRoles);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async loadCreatableRoles(roleId: string): Promise<DBResult<Role[]>> {
    try {
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
      return this.mapRolesToDomain(loadRoles);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async loadByNames(names: string[]): Promise<DBResult<Role[]>> {
    if (names.length === 0) return Ok([]);
    try {
      const roles = await this.roleRepo.findBy({
        name: In(names),
      });

      return this.mapRolesToDomain(roles);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async findById(id: string): Promise<DBResult<Option<Role>>> {
    try {
      const dbRole = await this.roleRepo.findOneBy({ id });
      if (dbRole === null) return Ok(None);
      return this.toDomain(dbRole).map((role) => Some(role));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async findByName(name: string): Promise<DBResult<Option<Role>>> {
    try {
      const dbRole = await this.roleRepo.findOneBy({ name });
      if (dbRole === null) return Ok(None);
      return this.toDomain(dbRole).map((role) => Some(role));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async loadAll(): Promise<DBResult<Role[]>> {
    try {
      const roles = await this.roleRepo.find();
      return this.mapRolesToDomain(roles);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }

  async rename(data: {
    userRoleId: string;
    role: Role;
  }): Promise<DBResult<Role>> {
    try {
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
      if (result.affected === 0 || !row) {
        return Err(
          new RecordNotFoundError(
            `role to be updated was not found: ${data.role.id}`,
          ),
        );
      }

      return this.toDomain(row);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async upsert(role: Role): Promise<DBResult<Role>> {
    try {
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
      if (!row) {
        return Err(new UnknownDatabaseError('Upsert did not return a row'));
      }

      return this.toDomain(row);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async deleteById(ids: {
    requesterRoleId: string;
    targetRoleId: string;
    defaultRoleId: string;
  }): Promise<DBResult<number>> {
    try {
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
        .andWhere(
          'target.permissions <@ (SELECT createScope FROM requester_scope)',
        );

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

      return Ok(result.affected ?? 0);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  private toDomain(r: RoleEntity): DBResult<Role> {
    const permError = (e: PermissionError) =>
      new CorruptedPersistenceDataError(
        'Failed to construct Permission at the database level',
        e,
      );
    const permissions = r.permissions.map((p) =>
      Permission.fromPrimitives(p).mapErr(permError),
    );
    const assignScope = r.assignScope?.map((p) =>
      Permission.fromPrimitives(p).mapErr(permError),
    );

    const createScope = r.createScope?.map((p) =>
      Permission.fromPrimitives(p).mapErr(permError),
    );
    for (const permList of [permissions, assignScope, createScope]) {
      const p = permList?.find((p) => p.isErr());
      if (p?.isErr()) {
        return p;
      }
    }
    return Role.restore({
      id: r.id,
      name: r.name,
      permissions: permissions.map((p) => p.unwrapOrThrow()),
      assignScope: assignScope?.map((p) => p.unwrapOrThrow()),
      createScope: createScope?.map((p) => p.unwrapOrThrow()),
    }).mapErr(
      (e) =>
        new CorruptedPersistenceDataError(
          `Failed to construct Role from RoleEntity: ${e.message}`,
          e,
        ),
    );
  }
  private mapRolesToDomain(roles: RoleEntity[]): DBResult<Role[]> {
    const domainRoles: Role[] = [];

    for (const role of roles) {
      const result = this.toDomain(role);

      if (result.isErr()) {
        return result;
      }

      domainRoles.push(result.unwrapOrThrow());
    }

    return Ok(domainRoles);
  }
}
