import { Result } from '@allawiii/results-ts';
import { serializeProps } from 'src/modules/shared/utils/serialize-props.util';
import { CategoryId, CategoryImageId, ImageId } from 'src/modules/shared/value-objects/ids';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';

export type CategoryImageRole = 'icon' | 'banner' | 'thumbnail';

type CategoryImageProps = {
  id: CategoryImageId;
  imageId: ImageId;
  categoryId: CategoryId;
  imageRole: CategoryImageRole;
  createdAt: Date;
};

type CategoryImagePrimitives = {
  id: string;
  imageId: string;
  categoryId: string;
  imageRole: CategoryImageRole;
  createdAt: string | Date;
};
type CreateCategoryImageProps = Omit<CategoryImagePrimitives, 'id' | 'createdAt'>;
export class CategoryImage {
  private constructor(private readonly props: CategoryImageProps) {}
  static create(data: CreateCategoryImageProps): Result<CategoryImage, ValueObjectError> {
    return this.build({ ...data, id: CategoryId.create().unwrap().toString(), createdAt: new Date() });
  }
  static restore(data: CategoryImagePrimitives): Result<CategoryImage, ValueObjectError> {
    return this.build(data);
  }
  private static build(data: CategoryImagePrimitives): Result<CategoryImage, ValueObjectError> {
    return Result.wrap(
      () =>
        new CategoryImage({
          id: CategoryImageId.create(data.id).unwrap(),
          categoryId: CategoryId.create(data.categoryId).unwrap(),
          imageId: ImageId.create(data.imageId).unwrap(),
          createdAt: new Date(data.createdAt),
          imageRole: data.imageRole,
        }),
    );
  }
  toJSON() {
    return serializeProps(this.props);
  }
}
