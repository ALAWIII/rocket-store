import { User } from '../../domain/user';

export type UpdateUserRepoData = {
  firstName?: string;
  lastName?: string;
  roleId?: string;
  phone?: string;
};

export interface IUserRepository {
  save(user: User): Promise<User>;
  updateByAuthId(
    authId: string,
    data: UpdateUserRepoData,
  ): Promise<User | null>;
  findByAuthId(authId: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
