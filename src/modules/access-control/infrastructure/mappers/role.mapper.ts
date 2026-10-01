import { Role } from '../../domain/role';
import { RoleEntity } from '../entities/role.entity';
import {
  CorruptedPersistenceDataError,
  DatabaseError,
} from 'src/modules/shared/errors/database.error';
import { Ok, Result } from '@allawiii/results-ts';
import { Permission } from '../../domain/permission';
import { PermissionError } from '../../domain/permission.error';

export class RoleMapper {
  static toDomain(r: RoleEntity): Result<Role, DatabaseError> {
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
      const err = permList?.find((p) => p.isErr())?.map<Role>();
      if (err) return err;
    }

    return Role.restore({
      id: r.id,
      name: r.name,
      permissions: permissions.map((p) => p.unwrap()),
      assignScope: assignScope?.map((p) => p.unwrap()),
      createScope: createScope?.map((p) => p.unwrap()),
    }).mapErr(
      (e) =>
        new CorruptedPersistenceDataError(
          `Failed to construct Role from RoleEntity: ${e.message}`,
          e,
        ),
    );
  }

  static toDomainList(entities: RoleEntity[]): Result<Role[], DatabaseError> {
    const roles: Role[] = [];
    for (const entity of entities) {
      const result = RoleMapper.toDomain(entity);

      if (result.isErr()) return result.map();

      roles.push(result.unwrap());
    }
    return Ok(roles);
  }
}
