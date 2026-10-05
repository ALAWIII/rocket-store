import { Ok, Result } from '@allawiii/results-ts';
import { serializeProps } from 'src/modules/shared/utils/serialize-props.util';
import { CategoryId } from 'src/modules/shared/value-objects/ids';
import { Name } from 'src/modules/shared/value-objects/name';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';

type CategoryProps = {
  id: CategoryId;
  name: Name;
  parentCategoryId: CategoryId | null;
  createdAt: Date;
};
type CategoryPrimitives = {
  id: string;
  name: string;
  parentCategoryId: string | null;
  createdAt: Date | string;
};
type CreateCategoryPrimitives = Pick<CategoryPrimitives, 'name' | 'parentCategoryId'>;

export class Category {
  private constructor(private props: CategoryProps) {}

  static create(data: CreateCategoryPrimitives): Result<Category, ValueObjectError> {
    return this.build({ ...data, createdAt: new Date(), id: CategoryId.create().unwrap().toString() });
  }

  static restore(data: CategoryPrimitives): Result<Category, ValueObjectError> {
    return this.build(data);
  }
  private static build(data: CategoryPrimitives): Result<Category, ValueObjectError> {
    return Result.wrap(
      () =>
        new Category({
          id: CategoryId.create(data.id).unwrap(),
          name: Name.create(data.name).unwrap(),
          parentCategoryId: (data.parentCategoryId ? CategoryId.create(data.parentCategoryId) : Ok(null)).unwrap(),
          createdAt: new Date(data.createdAt),
        }),
    );
  }
  toJSON() {
    return serializeProps(this.props);
  }
}
