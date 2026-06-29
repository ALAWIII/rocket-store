import { UserId } from 'src/modules/shared/domain/ids';
import { User } from '../../domain/user';

type UpdateUserData = {
  authId: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  phone?: string;
};

export interface IUserRepository {
  save(user: User): Promise<void>;
  updateByAuthId(data: UpdateUserData): Promise<User>;
  findByAuthId(authId: UserId): Promise<User | null>;
  findById(id: UserId): Promise<User | null>;
}
