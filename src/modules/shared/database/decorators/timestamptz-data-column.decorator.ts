import {
  CreateDateColumn,
  UpdateDateColumn,
  ColumnOptions,
  DeleteDateColumn,
} from 'typeorm';

// Custom Create Date Decorator
export function CreateDateColumnTz(options?: ColumnOptions) {
  return CreateDateColumn({
    type: 'timestamptz',
    ...options,
  });
}

// Custom Update Date Decorator
export function UpdateDateColumnTz(options?: ColumnOptions) {
  return UpdateDateColumn({
    type: 'timestamptz',
    ...options,
  });
}

export function DeleteDateColumnTz(options?: ColumnOptions) {
  return DeleteDateColumn({
    type: 'timestamptz',
    ...options,
  });
}
