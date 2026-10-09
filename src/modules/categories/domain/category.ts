import { Ok, Result } from '@allawiii/results-ts';
import { Image } from 'src/modules/images/domain/image';
import { serializeProps } from 'src/modules/shared/utils/serialize-props.util';
import { DomainText } from 'src/modules/shared/value-objects/domain-text';
import { CategoryId } from 'src/modules/shared/value-objects/ids';
import { Name } from 'src/modules/shared/value-objects/name';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';

type CategoryProps = {
  id: CategoryId;
  name: Name;
  parentId: CategoryId | null;
  path: CategoryId[];
  description?: DomainText | null;
  icon?: Image;
  thumbnail?: Image;
  createdAt: Date;
  updatedAt: Date;
};
type CategoryPrimitives = {
  id: string;
  name: string;
  path: string[];
  parentId: string | null;
  description?: string | null;
  icon?: Image;
  thumbnail?: Image;
  createdAt: Date | string;
  updatedAt: Date | string;
};
type CreateCategoryPrimitives = Omit<CategoryPrimitives, 'createdAt' | 'id'>;

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
          path: data.path.map((p) => CategoryId.create(p).unwrap()),
          description: (data.description ? DomainText.create(data.description, 125) : Ok(null)).unwrap(),
          parentId: (data.parentId ? CategoryId.create(data.parentId) : Ok(null)).unwrap(),
          icon: data.icon,
          thumbnail: data.thumbnail,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        }),
    );
  }
  toJSON() {
    return { ...serializeProps(this.props), path: this.props.path.map((p) => p.toJSON()) };
  }
}
