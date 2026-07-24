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

      const result = await this.roleRepo
        .createQueryBuilder()
        .insert()
        .into(RoleEntity, [
          'id',
          'name',
          'permissions',
          'assignScope',
          'createScope',
        ])
        .valuesFromSelect((qb) =>
          qb
            .select([
              ':id',
              ':name',
              ':permissions',
              ':assignScope',
              ':createScope',
            ])
            .from(RoleEntity, 'creator')
            .where('creator.id = :creatorRoleId')
            .andWhere('creator.create_scope @> :permissions'),
        )
        .setParameters({
          id: newRole.id,
          name: newRole.name,
          permissions: newRole.permissions,
          assignScope: newRole.assignScope,
          createScope: newRole.createScope,
          creatorRoleId,
        })
        .returning('*')
        .execute();

      const row = (result.raw as RoleEntity[])[0];
      if (!row) {
        return Err(
          new UnknownDatabaseError(
            'Creator create_scope does not contain new role permissions.',
          ),
        );
      }

      return Ok(this.toDomain(row));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async loadManageableRoles(roleId: string): Promise<DBResult<Role[]>> {
    try {
      const loadPerms = this.roleRepo
        .createQueryBuilder('r')
        .select([
          'r.create_scope AS create_scope',
          'r.assign_scope AS assign_scope',
        ])
        .where('r.id = :id', { id: roleId });

      const loadRoles = await this.roleRepo
        .createQueryBuilder('role')
        .addCommonTableExpression(loadPerms, 'role_perms')
        .where(
          new Brackets((qb) => {
            qb.where(
              `COALESCE((SELECT create_scope FROM role_perms), '[]'::jsonb) @> role.permissions`,
            ).orWhere(
              `COALESCE((SELECT assign_scope FROM role_perms), '[]'::jsonb) @> role.permissions`,
            );
          }),
        )
        .getMany();

      return Ok(loadRoles.map((r) => this.toDomain(r)));
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
      return Ok(roles.map((r) => this.toDomain(r)));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async findById(id: string): Promise<DBResult<Option<Role>>> {
    try {
      const r = await this.roleRepo.findOneBy({ id });
      if (r === null) return Ok(None);
      return Ok(Some(this.toDomain(r)));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async findByName(name: string): Promise<DBResult<Option<Role>>> {
    try {
      const r = await this.roleRepo.findOneBy({ name });
      if (r === null) return Ok(None);
      return Ok(Some(this.toDomain(r)));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async loadAll(): Promise<DBResult<Role[]>> {
    try {
      const rs = await this.roleRepo.find();
      return Ok(rs.map((r) => this.toDomain(r)));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }

  async rename(role: Role): Promise<DBResult<Role>> {
    try {
      const result = await this.roleRepo
        .createQueryBuilder()
        .update(RoleEntity)
        .set({ name: role.name })
        .where('id = :id', { id: role.id })
        .returning('*')
        .execute();
      const rows = result.raw as RoleEntity[];
      if (result.affected === 0 || rows.length === 0) {
        throw new RecordNotFoundError(
          `role to be updated was not found: ${role.id}`,
        );
      }
      const row = rows[0];
      return Ok(this.toDomain(row));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async upsert(role: Role): Promise<DBResult<Role>> {
    const perms = role.toJSON();
    try {
      const result = await this.roleRepo
        .createQueryBuilder()
        .insert()
        .into(RoleEntity)
        .values({
          id: role.id,
          name: role.name,
          permissions: perms.permissions,
          assignScope: perms.assignScope,
          createScope: perms.createScope,
        })
        .orUpdate(['permissions', 'assign_scope', 'create_scope'], ['name'])
        .returning('*')
        .execute();

      const row = (result.raw as RoleEntity[])[0];
      if (!row) {
        return Err(new UnknownDatabaseError('Upsert did not return a row'));
      }

      return Ok(this.toDomain(row));
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
        .select('requester.create_scope', 'create_scope')
        .where('requester.id = :requesterRoleId', {
          requesterRoleId: ids.requesterRoleId,
        });

      const deletableTargetCte = this.roleRepo
        .createQueryBuilder('target')
        .select('target.id', 'id')
        .where('target.id = :targetRoleId', { targetRoleId: ids.targetRoleId })
        .andWhere(
          'target.permissions <@ (SELECT create_scope FROM requester_scope)',
        );

      const reassignedUsersCte = this.roleRepo.manager
        .createQueryBuilder()
        .update(UserEntity)
        .set({ roleId: ids.defaultRoleId })
        .where('role_id IN (SELECT id FROM deletable_target)')
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
  private toDomain(r: RoleEntity): Role {
    const permError = (e: PermissionError) =>
      new CorruptedPersistenceDataError(
        'Failed to construct Permission at the database level',
        e,
      );
    const permissions = r.permissions.map((p) =>
      Permission.fromPrimitives(p).mapErr(permError).unwrap(),
    );
    const assignScope = r.assignScope
      ? r.assignScope.map((p) =>
          Permission.fromPrimitives(p).mapErr(permError).unwrap(),
        )
      : undefined;
    const createScope = r.createScope
      ? r.createScope.map((p) =>
          Permission.fromPrimitives(p).mapErr(permError).unwrap(),
        )
      : undefined;
    return Role.restore({
      id: r.id,
      name: r.name,
      permissions,
      assignScope,
      createScope,
    })
      .mapErr(
        (e) =>
          new CorruptedPersistenceDataError(
            `Failed to construct Role from RoleEntity.`,
            e,
          ),
      )
      .unwrap();
  }
}
