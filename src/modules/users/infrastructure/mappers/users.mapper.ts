import { User } from '../../domain/user';
import { UserEntity } from '../entities/user.entity';
import {
  CorruptedPersistenceDataError,
  DatabaseError,
} from 'src/modules/shared/errors/database.error';
import { Ok, Result } from '@allawiii/results-ts';
import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';

export class UserMapper {
  static toDomain(
    entity: UserEntity & { profileImage?: ImageEntity },
  ): Result<User, DatabaseError> {
    const profImgCreatedAt = entity.profileImage?.createdAt.toJSON() ?? '';
    return User.fromPrimitives({
      id: entity.id,
      email: entity.email,
      name: entity.name,
      givenName: entity.givenName,
      familyName: entity.familyName,
      roleId: entity.roleId,
      updatedAt: entity.updatedAt,
      createdAt: entity.createdAt,
      phone: entity.phone ?? undefined,
      image: entity.profileImage
        ? { ...entity.profileImage, createdAt: profImgCreatedAt }
        : undefined,
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
