import { DBResult } from 'src/modules/shared/errors/error.types';
import { User } from '../../domain/user';
import { Option } from 'ts-results-es';

export type UpdateUserRepoData = {
  name?: string;
  givenName?: string;
  familyName?: string;
  roleId?: string;
  phone?: string;
};

export abstract class IUserRepository {
  abstract save(user: User): Promise<DBResult<User>>;
  abstract updateById(
    id: string,
    data: UpdateUserRepoData,
  ): Promise<DBResult<Option<User>>>;
  abstract findById(id: string): Promise<DBResult<Option<User>>>;
  abstract reassignUsersRole(
    oldRoleId: string,
    newRoleId: string,
  ): Promise<DBResult<number>>;
}
