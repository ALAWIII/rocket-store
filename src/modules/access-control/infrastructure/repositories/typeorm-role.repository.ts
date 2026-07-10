import { Injectable } from '@nestjs/common';
import { IRoleRepository } from './role.repository';
import { Role } from '../../domain/role';
import { Action, Entity, Permission, Scope } from '../../domain/permission';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from '../entities/role.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
  ) {}
  async loadByNames(names: string[]): Promise<Role[]> {
    if (names.length === 0) return [];
    const roles = await this.roleRepo.findBy({
      name: In(names),
    });
    return roles.map((r) => this.toDomain(r));
  }
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

  async update(role: Role): Promise<Role> {
    const perms = role.permissions.map((p) => p.toJSON());

    const result = await this.roleRepo
      .createQueryBuilder()
      .update(RoleEntity)
      .set({ name: role.name, permissions: perms })
      .where('id = :id', { id: role.id })
      .returning('*')
      .execute();

    const rows = result.raw as RoleEntity[];
    const row = rows[0];
    if (!row) {
      throw new Error(
        `Role update succeeded but returned no row for id=${role.id}`,
      );
    }

    return this.toDomain(row);
  }
  async upsertByName(name: string, perms: Permission[]): Promise<Role> {
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
    const row = rows[0];
    if (!row) {
      throw new Error(
        `Role upsert succeeded but returned no row for name=${name}`,
      );
    }
    return this.toDomain(row);
  }
  async removeById(id: string): Promise<number> {
    const deleteResult = await this.roleRepo.delete({ id });
    return deleteResult.affected ?? 0;
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
