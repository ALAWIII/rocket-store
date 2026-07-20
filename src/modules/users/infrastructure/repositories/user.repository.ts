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

export type FilterUsersByData = {
  name?: string; // this will be matched against 3 name fields (name,givenName,familyName) and with OR operator
  email?: string;
  roleId?: string;
  phone?: string;
  page?: number;
  limit?: number;
};
export abstract class IUserRepository {
  abstract findAll(d: {
    page: number;
    limit: number;
  }): Promise<DBResult<{ users: User[]; total: number }>>;
  abstract findById(id: string): Promise<DBResult<Option<User>>>;
  abstract findBy(
    data: FilterUsersByData,
  ): Promise<DBResult<{ users: User[]; total: number }>>;
  abstract findByEmail(email: string): Promise<DBResult<Option<User>>>;
  abstract save(user: User): Promise<DBResult<User>>;
  abstract updateById(
    id: string,
    data: UpdateUserRepoData,
  ): Promise<DBResult<Option<User>>>;
  abstract reassignUsersRole(
    oldRoleId: string,
    newRoleId: string,
  ): Promise<DBResult<number>>;
}
