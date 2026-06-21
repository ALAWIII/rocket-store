import { PrimaryColumn, PrimaryColumnOptions } from 'typeorm';

type UuidV7PrimaryColumnOptions = Omit<
  PrimaryColumnOptions,
  'default' | 'type'
>;

export function UuidV7PrimaryColumn(
  options: UuidV7PrimaryColumnOptions = {},
): PropertyDecorator {
  return PrimaryColumn('uuid', {
    default: () => 'uuidv7()',
    ...options,
  });
}
