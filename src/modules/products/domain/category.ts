import { CategoryId } from 'src/modules/shared/domain/ids';
import { Name } from 'src/modules/shared/value-objects/name';

type CategoryProps = {
  id: CategoryId;
  name: Name;
  parentCategoryId: CategoryId | null;
  createdAt: Date;
};
type CreateCategoryProps = Omit<CategoryProps, 'createdAt'>;

type UpdateCategoryProps = Partial<Omit<CategoryProps, 'id' | 'createdAt'>>;
export class Category {
  private constructor(private props: CategoryProps) {}

  static create(data: CreateCategoryProps): Category {
    return new Category({
      ...data,
      createdAt: new Date(),
    });
  }

  static restore(data: CategoryProps): Category {
    return new Category(data);
  }

  get id(): CategoryId {
    return this.props.id;
  }

  get name(): Name {
    return this.props.name;
  }

  get parentCategoryId(): CategoryId | undefined | null {
    return this.props.parentCategoryId;
  }
  update(props: UpdateCategoryProps): void {
    if (props.name !== undefined) {
      this.props.name = props.name;
    }

    if (props.parentCategoryId !== undefined) {
      if (props.parentCategoryId === this.id) {
        throw new Error('Category cannot be parent of itself');
      }
      this.props.parentCategoryId = props.parentCategoryId;
    }
  }

  toJSON(): CategoryProps {
    return { ...this.props };
  }
}
