import { DBResult } from 'src/modules/shared/errors/error.types';
import { Category } from '../../domain/category';

export abstract class ICategoryRepository {
  // --- 1. WRITE OPERATIONS ---

  // Fetches parent path, derives new path, inserts
  abstract create(data: Category): DBResult<Category>;

  // Simple metadata update (no path logic)
  abstract updateDetails(id: string, data: { name?: string; description?: string }): DBResult<Category>;

  // Complex tree update (cycle checks + path array slicing), returns the new moved category
  abstract move(id: string, newParentId: string | null): DBResult<Category>;

  // Deletion (handles withSubtree flag internally via path matching), returns number of affected
  abstract delete(id: string, withSubtree: boolean): DBResult<number>;

  // --- 2. READ OPERATIONS ---

  // should fail if the id not found
  abstract findById(id: string): DBResult<Category>;

  // Get category + all descendants (uses WHERE path @> ARRAY[id])
  abstract findSubtree(id: string): DBResult<Category[]>;

  abstract findAll(): DBResult<Category[]>;
}
