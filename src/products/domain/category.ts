import { AuditableEntity, AuditFields } from 'src/shared/domain/auditing';
import { UserId } from 'src/shared/domain/ids';

export type CategoryId = string;
type CreateCategoryProps = {
  id: CategoryId;
  name: string;
  parentCategoryId: CategoryId | null;
  createdBy: UserId;
};
type CategoryProps = {
  id: CategoryId;
  name: string;
  parentCategoryId: CategoryId | null;
  audit: AuditFields;
};
type FlatCategoryProps = {
  id: CategoryId;
  name: string;
  parentCategoryId: CategoryId | null;
} & AuditFields;
type UpdateCategoryProps = {
  updatedBy: UserId;
  name?: string;
  parentCategoryId?: CategoryId | null;
};
export class Category extends AuditableEntity {
  private constructor(private data: CategoryProps) {
    super(data.audit);
  }

  static create(data: CreateCategoryProps): Category {
    const now = new Date();

    return new Category({
      id: data.id,
      name: Category.validateName(data.name),
      parentCategoryId: data.parentCategoryId,
      audit: {
        createdAt: now,
        updatedAt: now,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    });
  }

  static restore(data: FlatCategoryProps): Category {
    return new Category({
      id: data.id,
      name: Category.validateName(data.name),
      parentCategoryId: data.parentCategoryId,
      audit: {
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
      },
    });
  }
  private static validateName(name: string): string {
    const normalized = name.trim();
    if (normalized.length < 2) {
      throw new Error('Category name must be at least 2 characters.');
    }
    if (normalized.length > 20) {
      throw new Error('Category name must not exceed 20 characters.');
    }
    return normalized;
  }
  get id(): CategoryId {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get parentCategoryId(): CategoryId | undefined | null {
    return this.data.parentCategoryId;
  }
  update(props: UpdateCategoryProps): void {
    if (props.name !== undefined) {
      this.data.name = Category.validateName(props.name);
    }

    if (props.parentCategoryId !== undefined) {
      if (props.parentCategoryId === this.id) {
        throw new Error('Category cannot be parent of itself');
      }
      this.data.parentCategoryId = props.parentCategoryId;
    }

    this.touch(props.updatedBy);
  }

  toJSON(): FlatCategoryProps {
    return {
      id: this.data.id,
      name: this.data.name,
      parentCategoryId: this.data.parentCategoryId,
      ...this.data.audit,
    };
  }
}
