import { Option } from 'ts-results-es';
import { Role } from '../../domain/role';
import type { DBResult } from 'src/modules/shared/errors/error.types';

export abstract class IRoleRepository {
  abstract loadAll(): Promise<DBResult<Role[]>>;
  abstract loadByNames(names: string[]): Promise<DBResult<Role[]>>;
  abstract findById(id: string): Promise<DBResult<Option<Role>>>;
  abstract findByName(name: string): Promise<DBResult<Option<Role>>>;
  abstract upsert(role: Role): Promise<DBResult<Role>>;
  abstract update(role: Role): Promise<DBResult<Option<Role>>>;
  abstract removeById(id: string): Promise<DBResult<number>>;
}
