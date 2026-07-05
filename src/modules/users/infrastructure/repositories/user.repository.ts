import { User } from '../../domain/user';

export type UpdateUserRepoData = {
  name?: string;
  givenName?: string;
  familyName?: string;
  roleId?: string;
  phone?: string;
};

export abstract class IUserRepository {
  abstract save(user: User): Promise<User>;
  abstract updateById(
    id: string,
    data: UpdateUserRepoData,
  ): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
}
