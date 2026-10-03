import { DBResult } from 'src/modules/shared/errors/error.types';
import { User } from '../../domain/user';
import { UserImage } from '../../domain/user-image';
import { Option } from '@allawiii/results-ts';
export type UpdateUserRepoData = {
  name?: string;
  givenName?: string;
  familyName?: string;
  phone?: string;
};
export type UserFilters = {
  name?: string; // this will be matched against 3 name fields (name,givenName,familyName) and with OR operator
  email?: string;
  roleId?: string;
  phone?: string;
};

export type FindUsersByParams = {
  requesterRoleId: string;
  filters?: UserFilters;
  page?: number;
  limit?: number;
};

export abstract class IUserRepository {
  abstract findById(data: {
    requesterRoleId: string;
    userId: string;
  }): DBResult<User>;
  abstract findMe(id: string): DBResult<User>;
  abstract findBy(
    data: FindUsersByParams,
  ): DBResult<{ users: User[]; total: number }>;
  abstract updateById(id: string, data: UpdateUserRepoData): DBResult<User>;
  abstract attachImage(userImg: UserImage): DBResult<Option<string>>;
  abstract assignUsersRole(d: {
    requesterRoleId: string;
    oldRoleId: string;
    newRoleId: string;
  }): DBResult<number>;
  abstract assignUserRole(d: {
    requesterRoleId: string;
    targetUserId: string;
    targetRoleId: string;
  }): DBResult<User>;
  abstract findUserImage(userId: string): DBResult<UserImage>;
}
