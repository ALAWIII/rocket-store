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
export type UserFilters = {
  name?: string; // this will be matched against 3 name fields (name,givenName,familyName) and with OR operator
  email?: string;
  roleId?: string;
  phone?: string;
};
export type FindAllUsersParams = {
  requesterRoleId: string;
  page?: number;
  limit?: number;
};
export type FindUsersByParams = {
  requesterRoleId: string;
  filters?: UserFilters;
  page?: number;
  limit?: number;
};

export abstract class IUserRepository {
  abstract findAll(
    d: FindAllUsersParams,
  ): Promise<DBResult<{ users: User[]; total: number }>>;
  abstract findById(data: {
    requesterRoleId: string;
    userId: string;
  }): Promise<DBResult<User>>;
  abstract findBy(
    data: FindUsersByParams,
  ): Promise<DBResult<{ users: User[]; total: number }>>;
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
