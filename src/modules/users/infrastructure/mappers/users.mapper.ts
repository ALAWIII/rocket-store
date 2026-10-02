import { User } from '../../domain/user';
import { UserEntity } from '../entities/user.entity';
import {
  CorruptedPersistenceDataError,
  DatabaseError,
} from 'src/modules/shared/errors/database.error';
import { Ok, Result } from '@allawiii/results-ts';

export class UserMapper {
  static toDomain(entity: UserEntity): Result<User, DatabaseError> {
    return User.fromPrimitives({
      id: entity.id,
      email: entity.email,
      name: entity.name,
      givenName: entity.givenName,
      familyName: entity.familyName,
      image: entity.image ?? undefined,
      roleId: entity.roleId,
      phone: entity.phone ?? undefined,
      updatedAt: entity.updatedAt,
      createdAt: entity.createdAt,
    }).mapErr(
      (e) =>
        new CorruptedPersistenceDataError(
          `Failed to construct User from UserEntity: ${e.message}`,
          e,
        ),
    );
  }

  static toDomainList(entities: UserEntity[]): Result<User[], DatabaseError> {
    const users: User[] = [];
    for (const entity of entities) {
      const result = UserMapper.toDomain(entity);
      if (result.isErr()) {
        return result.map();
      }
      users.push(result.unwrap());
    }
    return Ok(users);
  }
}
