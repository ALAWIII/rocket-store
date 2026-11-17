import { ValueOf } from 'src/modules/shared/types/value-of';
import { SortByOptions } from '../../application/models/sort-by-options';

export const SORT_BY_OPTIONS_MAP = {
  created: 'createdAt',
  updated: 'updatedAt',
  title: 'title',
  price: 'price',
  rating: 'rating',
} as const;
export type SortByOptionsMap = ValueOf<typeof SORT_BY_OPTIONS_MAP>;

export function mapSortOption(option: SortByOptions): SortByOptionsMap {
  return SORT_BY_OPTIONS_MAP[option];
}
