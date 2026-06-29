import { User } from '../../domain/user';

export type UpdateUserRepoData = {
  firstName?: string;
  lastName?: string;
  roleId?: string;
  phone?: string;
};

export abstract class IUserRepository {
  abstract save(user: User): Promise<User>;
  abstract updateByAuthId(
    authId: string,
    data: UpdateUserRepoData,
  ): Promise<User | null>;
  abstract findByAuthId(authId: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
}
