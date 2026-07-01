import { Injectable } from '@nestjs/common';
import { IRoleRepository } from './role.repository';
import { Role } from '../../domain/role';
import { Action, Entity, Permission, Scope } from '../../domain/permission';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from '../entities/role.entity';
import { Repository } from 'typeorm';
import { RoleId } from 'src/modules/shared/domain/ids';
import { Name } from 'src/modules/shared/value-objects/name';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
  ) {}
  async findById(id: string): Promise<Role | null> {
    const r = await this.roleRepo.findOneBy({ id });
    if (r === null) return null;
    return this.toDomain(r);
  }
  async findByName(name: string): Promise<Role | null> {
    const r = await this.roleRepo.findOneBy({ name });
    if (r === null) return null;
    return this.toDomain(r);
  }
  async loadAll(): Promise<Role[]> {
    const rs = await this.roleRepo.find();
    return rs.map((r) => this.toDomain(r));
  }

  async updateById(id: string, perms: Permission[]): Promise<Role | null> {
    const nPerms = perms.map((p) => p.toJSON());

    const result = await this.roleRepo
      .createQueryBuilder()
      .update(RoleEntity)
      .set({ permissions: nPerms })
      .where('id = :id', { id })
      .returning('*')
      .execute();

    const rows = result.raw as RoleEntity[];
    const row = rows[0] ?? null;

    return row ? this.toDomain(row) : null;
  }
  async upsertByName(name: string, perms: Permission[]): Promise<Role | null> {
    const nPerms = perms.map((p) => p.toJSON());

    const result = await this.roleRepo
      .createQueryBuilder()
      .insert()
      .into(RoleEntity)
      .values({ name, permissions: nPerms })
      .orUpdate(['permissions'], ['name'])
      .returning('*')
      .execute();

    const rows = result.raw as RoleEntity[];
    const row = rows[0] ?? null;

    return row ? this.toDomain(row) : null;
  }
  private toDomain(r: RoleEntity): Role {
    const perms = r.permissions.map((p) =>
      Permission.create(
        p.entity as Entity,
        p.action as Action,
        p.scope as Scope,
      ),
    );
    return new Role(RoleId.create(r.id), Name.create(r.name), perms);
  }
}
