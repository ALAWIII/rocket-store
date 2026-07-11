import { Injectable } from '@nestjs/common';
import { IRoleRepository } from './role.repository';
import { Role } from '../../domain/role';
import { Action, Entity, Permission, Scope } from '../../domain/permission';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from '../entities/role.entity';
import { In, Repository } from 'typeorm';
import type { DBResult } from 'src/modules/shared/errors/error.types';
import { Err, None, Ok, Option, Some } from 'ts-results-es';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { UnknownDatabaseError } from 'src/modules/shared/errors/database.error';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
  ) {}

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

  async update(role: Role): Promise<DBResult<Option<Role>>> {
    const perms = role.permissions.map((p) => p.toJSON());
    try {
      const result = await this.roleRepo
        .createQueryBuilder()
        .update(RoleEntity)
        .set({ name: role.name, permissions: perms })
        .where('id = :id', { id: role.id })
        .returning('*')
        .execute();

      const rows = result.raw as RoleEntity[];
      const row = rows[0];
      return Ok(row ? Some(this.toDomain(row)) : None);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async upsert(role: Role): Promise<DBResult<Role>> {
    const perms = role.permissions.map((p) => p.toJSON());

    try {
      const result = await this.roleRepo
        .createQueryBuilder()
        .insert()
        .into(RoleEntity)
        .values({ id: role.id, name: role.name, permissions: perms })
        .orUpdate(['permissions'], ['name'])
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
  async removeById(id: string): Promise<DBResult<number>> {
    try {
      const deleteResult = await this.roleRepo.delete({ id });
      return Ok(deleteResult.affected ?? 0);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  private toDomain(r: RoleEntity): Role {
    const perms = r.permissions.map((p) =>
      Permission.create(
        p.entity as Entity,
        p.action as Action,
        p.scope as Scope,
      ),
    );
    return Role.restore({ ...r, permissions: perms });
  }
}
